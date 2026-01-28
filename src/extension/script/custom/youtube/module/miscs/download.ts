import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTCommon, YTEndpoint, YTRenderer, YTResponse, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { registerYTInnertubeRequestProcessor, YTInnertubeRequest, YTInnertubeRequestContext, YTInnertubeRequestEndpoint, YTInnertubeRequestPlaybackContext } from '@ext/custom/youtube/module/core/network'
import { decodeEntityKey, encodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { UMPSliceType } from '@ext/custom/youtube/proto/gvs/common/enum'
import UMPMediaHeader from '@ext/custom/youtube/proto/gvs/ump/media-header'
import UMPStreamProtectionStatus from '@ext/custom/youtube/proto/gvs/ump/stream-protection-status'
import OfflineState, { OfflineStateAction } from '@ext/custom/youtube/proto/offline-state'
import PlayerParams from '@ext/custom/youtube/proto/player-params'
import { updateYTReduxStoreLocalEntities } from '@ext/custom/youtube/utils/redux'
import SabrDownloader, { SabrFormatInfo } from '@ext/custom/youtube/utils/sabr-downloader'
import { UMPSlice } from '@ext/custom/youtube/utils/ump'
import { floor } from '@ext/global/math'
import { assign, fromEntries } from '@ext/global/object'
import { bufferConcat, bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTMISCS-DOWNLOAD')

interface InnertubeFeedInfo {
  expire: number
  response: YTValueData<YTResponse.Mapped<'browse'>>
}

interface InnertubeChannelInfo extends InnertubeFeedInfo {
  detail: YTValueData<YTRenderer.Mapped<'microformatDataRenderer'>>
}

interface InnertubePlaylistInfo extends InnertubeFeedInfo {
  detail: YTValueData<YTRenderer.Mapped<'microformatDataRenderer'>>
  channelId: string
  videoIds: string[]
}

interface InnertubeVideoInfo {
  expire: number
  response: YTValueData<YTResponse.Mapped<'player'>>
  detail: YTValueData<YTRenderer.Mapped<'playerMicroformatRenderer'>>
}

interface DownloadButtonContext {
  videoId: string
  entityKey: string
}

interface PlaybackDataSnapshot {
  videoId: string
  params: string[]
  ustreamerConfig: string
  formats: SabrFormatInfo[]
}

const DOWNLOAD_ID_PREFIX = 'ytdl:'
const SNAPSHOT_PARAM_NAME = 'pdsnapshot'
const INFO_CACHE_TTL = 300e3 // 5 min

const feedInfoCache = new Map<string, InnertubeFeedInfo>()
const videoInfoCache = new Map<string, InnertubeVideoInfo>()
const forceDownloadVideoIds = new Set<string>()

let downloaderId: string | null = null
let downloader: SabrDownloader | null = null

let isPremium: boolean = false
let downloadButtonContext: DownloadButtonContext | null = null
let fetchingPlaylistInfo: ({ playlistId: string } & Partial<InnertubePlaylistInfo>) | null = null
let devicePlaybackCapabilities: YTInnertubeRequestPlaybackContext['devicePlaybackCapabilities'] | null = null

const getLengthText = (seconds?: string | number): string => {
  seconds = Number(seconds ?? 0)
  const segments = [floor(seconds / 3600), floor(seconds / 60) % 60, seconds % 60]
  while (segments.length > 1 && segments[0] <= 0) segments.shift()
  return segments.map(n => n.toString().padStart(2, '0')).join(':')
}

const buildDownloadQualityFormat = <const T extends `${YTCommon.enums.OfflineFormatType}`>(format: T, name: string) => ({
  availabilityType: 'OFFLINEABILITY_AVAILABILITY_TYPE_PREMIUM_UNLOCKED',
  format,
  name,
  savedSettingShouldExpire: false
} as const)

const fetchInnertube = async <
  E extends YTInnertubeRequestEndpoint,
  R extends YTResponse.MappedKey,
  M extends Record<string, unknown> = {}
>(endpoint: E, request: Omit<YTInnertubeRequest<E>, keyof M> & M): Promise<YTValueData<YTResponse.Mapped<R>>> => {
  const response = await fetch(`/youtubei/v1/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  })
  return response.json()
}

const fetchInnertubeFeed = async <T extends InnertubeFeedInfo>(
  processor: (info: InnertubeFeedInfo) => Promise<T> | T,
  browseId: string,
  context?: YTInnertubeRequestContext
): Promise<T> => {
  const now = Date.now()

  for (const [key, { expire }] of Array.from(feedInfoCache.entries())) {
    if (expire <= now) feedInfoCache.delete(key)
  }

  let info = feedInfoCache.get(browseId) as T
  if (info != null) return info

  info = await processor({
    expire: now + INFO_CACHE_TTL,
    response: await fetchInnertube<'browse', 'browse'>('browse', {
      context,
      browseId
    })
  })
  feedInfoCache.set(browseId, info)

  return info
}

const fetchInnertubeChannel = (channelId: string, context?: YTInnertubeRequestContext): Promise<InnertubeChannelInfo> => {
  return fetchInnertubeFeed(({ expire, response }) => {
    const detail = response.microformat?.microformatDataRenderer
    if (detail == null) throw new Error('invalid channel data')

    return { expire, response, detail }
  }, channelId, context)
}

const fetchInnertubePlaylist = async (playlistId: string, context?: YTInnertubeRequestContext): Promise<InnertubePlaylistInfo> => {
  try {
    fetchingPlaylistInfo = { playlistId }

    return await fetchInnertubeFeed(({ expire, response }) => {
      if (fetchingPlaylistInfo?.playlistId !== playlistId) throw new Error('invalid context')

      const { microformat } = response
      const { channelId, videoIds } = fetchingPlaylistInfo

      const detail = microformat?.microformatDataRenderer
      if (channelId == null || videoIds == null || detail == null) throw new Error('invalid playlist data')

      return { expire, response, detail, channelId, videoIds }
    }, `VL${playlistId}`, context)
  } finally {
    if (fetchingPlaylistInfo?.playlistId === playlistId) fetchingPlaylistInfo = null
  }
}

const fetchInnertubeVideo = async (videoId: string, context?: YTInnertubeRequestContext): Promise<InnertubeVideoInfo> => {
  const now = Date.now()

  for (const [key, { expire }] of Array.from(videoInfoCache.entries())) {
    if (expire <= now) videoInfoCache.delete(key)
  }

  let info = videoInfoCache.get(videoId)
  if (info != null) return info

  const response = await fetchInnertube<'player', 'player', { params?: string }>('player', {
    attestationRequest: { omitBotguardData: true },
    context,
    playbackContext: {
      contentPlaybackContext: {
        currentUrl: `/watch?v=${videoId}`,
        html5Preference: 'HTML5_PREF_WANTS',
        lactMilliseconds: '-1',
        signatureTimestamp: ytcfg?.get('STS')
      },
      devicePlaybackCapabilities: {
        ...devicePlaybackCapabilities
      }
    },
    videoId
  })
  const { playabilityStatus } = response

  const detail = response.microformat?.playerMicroformatRenderer
  if (playabilityStatus?.status !== 'OK' || detail == null) throw new Error('no video data')

  info = {
    expire: now + INFO_CACHE_TTL,
    response,
    detail
  }
  videoInfoCache.set(videoId, info)

  return info
}

const fetchOfflineChannelData = async (channelId: string, context?: YTInnertubeRequestContext): Promise<YTValueData<YTRenderer.Mapped<'offlineChannelData'>>> => {
  const { detail: { thumbnail, title } } = await fetchInnertubeChannel(channelId, context)

  return {
    channelId,
    isChannelOwner: false,
    thumbnail,
    title
  }
}

const fetchOfflinePlaylistData = async (playlistId: string, context?: YTInnertubeRequestContext): Promise<YTValueData<YTRenderer.Mapped<'offlinePlaylistData'>>> => {
  const { detail: { thumbnail, title }, channelId, videoIds } = await fetchInnertubePlaylist(playlistId, context)

  return {
    channel: {
      offlineChannelData: await fetchOfflineChannelData(channelId, context)
    },
    isPrivate: false,
    lastModifiedTimestamp: '',
    offlinePlaylistToken: `${DOWNLOAD_ID_PREFIX}playlist`,
    playlistId,
    privacy: 'PUBLIC',
    shareUrl: '',
    thumbnail,
    title,
    totalVideoCount: '0',
    videos: await batchFetchOfflineVideoData(videoIds, context)
  }
}

const fetchOfflineVideoData = async (videoId: string, context?: YTInnertubeRequestContext): Promise<YTValueData<YTRenderer.Mapped<'offlineVideoData'>>> => {
  const {
    detail: {
      description,
      externalChannelId,
      lengthSeconds,
      likeCount,
      publishDate,
      thumbnail,
      title,
      viewCount
    }
  } = await fetchInnertubeVideo(videoId, context)

  if (externalChannelId == null) throw new Error('missing channel id')

  return {
    channel: {
      offlineChannelData: await fetchOfflineChannelData(externalChannelId, context)
    },
    description,
    lengthSeconds,
    lengthText: getLengthText(lengthSeconds),
    likesCount: likeCount,
    publishedTimestamp: `${floor(new Date(publishDate ?? Date.now()).getTime() / 1e3)}`,
    shortViewCountText: viewCount,
    thumbnail,
    title: title?.simpleText,
    videoId,
    viewCount
  }
}

const batchFetchOfflinePlaylistData = async (playlistIds: string[], context?: YTInnertubeRequestContext): Promise<YTValueData<{ type: YTValueType.RENDERER }>[]> => {
  return (await Promise.allSettled(playlistIds.map(playlistId => {
    return fetchOfflinePlaylistData(playlistId, context)
  }))).filter(result => result.status === 'fulfilled').map(result => ({
    offlinePlaylistData: result.value
  }))
}

const batchFetchOfflineVideoData = async (videoIds: string[], context?: YTInnertubeRequestContext): Promise<YTValueData<{ type: YTValueType.RENDERER }>[]> => {
  return (await Promise.allSettled(videoIds.map(videoId => {
    return fetchOfflineVideoData(videoId, context)
  }))).filter(result => result.status === 'fulfilled').map(result => ({
    offlineVideoData: result.value
  }))
}

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url } = ctx
  const { searchParams } = url

  let snapshot: PlaybackDataSnapshot
  try {
    snapshot = JSON.parse(searchParams.get(SNAPSHOT_PARAM_NAME)!)
    if (snapshot == null) return
  } catch {
    return
  }

  try {
    const { videoId, params, ustreamerConfig, formats } = snapshot

    const { id, pot, itag, range } = fromEntries(searchParams.entries())
    const [start, end] = range?.split('-').map(Number) ?? []

    if (id == null || pot == null || itag == null) throw new Error('missing params')

    for (const key of Array.from(searchParams.keys())) {
      if (!params.includes(key)) searchParams.delete(key)
    }

    if (downloaderId !== id || downloader == null) {
      downloader = new SabrDownloader({
        locale: ytcfg?.get('GAPI_LOCALE'),
        clientName: ytcfg?.get('INNERTUBE_CONTEXT_CLIENT_NAME'),
        clientVersion: ytcfg?.get('INNERTUBE_CONTEXT_CLIENT_VERSION'),
        baseUrl: url.toString(),
        ustreamerConfig,
        formats,
        playbackRate: 20
      })
      downloaderId = id
    }
    if (pot != null) downloader.setPoToken(bufferFromString(pot, 'base64url'))

    const [formatId, buffer] = await downloader.getChunk(Number(itag), start, end == null ? end : end + 1)
    const header = new Uint8Array([0])

    logger.trace(`downloaded range(${start}-${end}):`, formatId, buffer)

    setTimeout(updateYTReduxStoreLocalEntities, 1e3)

    assign<NetworkContext, NetworkContextState>(ctx, {
      state: NetworkState.SUCCESS,
      response: new Response(bufferConcat([
        new UMPSlice(UMPSliceType.STREAM_PROTECTION_STATUS, new UMPStreamProtectionStatus({ status: 1 }).serialize()),
        new UMPSlice(UMPSliceType.MEDIA_HEADER, new UMPMediaHeader({
          headerId: 0,
          videoId,
          itag: formatId.itag,
          lmt: formatId.lmt,
          xtags: formatId.xtags,
          startRange: BigInt(start ?? 0),
          formatId,
          contentLength: BigInt(buffer.length)
        }).serialize()),
        new UMPSlice(UMPSliceType.MEDIA, bufferConcat([header, buffer])),
        new UMPSlice(UMPSliceType.MEDIA_END, header)
      ].map(s => s.toBytes())))
    })
  } catch (error) {
    logger.warn('download request error:', error)

    assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
  }
}

const processPlaylistVideoListRenderer = (data: YTValueData<YTRenderer.Mapped<'playlistVideoListRenderer'>>): boolean => {
  const { contents, playlistId } = data

  if (playlistId != null && fetchingPlaylistInfo?.playlistId === playlistId) {
    fetchingPlaylistInfo.videoIds ??= []
    fetchingPlaylistInfo.videoIds.push(...contents?.map(({ playlistVideoRenderer }) => {
      const channelId = playlistVideoRenderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
      if (channelId != null && fetchingPlaylistInfo != null) fetchingPlaylistInfo.channelId ??= channelId

      return playlistVideoRenderer?.videoId
    }).filter(videoId => videoId != null) ?? [])
  }

  return true
}

const processTopbarLogoRenderer = (data: YTValueData<YTRenderer.Mapped<'topbarLogoRenderer'>>): boolean => {
  isPremium = data.iconImage?.iconType === 'YOUTUBE_PREMIUM_LOGO'

  return true
}

const processVideoOwnerRenderer = (data: YTValueData<YTRenderer.Mapped<'videoOwnerRenderer'>>): boolean => {
  const channelId = data.navigationEndpoint?.browseEndpoint?.browseId
  if (channelId != null && fetchingPlaylistInfo != null) fetchingPlaylistInfo.channelId = channelId

  return true
}

const updateVideoPrimaryInfoRenderer = (data: YTValueData<YTRenderer.Mapped<'videoPrimaryInfoRenderer'>>): boolean => {
  const items = data.videoActions?.menuRenderer?.flexibleItems
  if (!Array.isArray(items) || downloadButtonContext == null) return true

  let item = items.find(item => item.menuFlexibleItemRenderer?.topLevelButton?.downloadButtonRenderer != null)
  if (item != null) return true

  const { videoId, entityKey } = downloadButtonContext

  const endpoint = {
    offlineVideoEndpoint: {
      videoId,
      onAddCommand: {
        getDownloadActionCommand: {
          videoId,
          params: encodeURIComponent(bufferToString(new PlayerParams({ b1: true, b2: false }).serialize(), 'base64url')),
          offlineabilityEntityKey: entityKey,
          isCrossDeviceDownload: false
        }
      }
    }
  } satisfies YTValueData<{ type: YTValueType.ENDPOINT }>

  items.unshift({
    menuFlexibleItemRenderer: {
      menuItem: { menuServiceItemDownloadRenderer: { serviceEndpoint: endpoint } },
      topLevelButton: {
        downloadButtonRenderer: {
          style: 'STYLE_DEFAULT',
          size: 'SIZE_DEFAULT',
          targetId: 'watch-download-button',
          command: endpoint
        }
      }
    }
  })

  return true
}

const updatePlayerResponse = (data: YTValueData<YTResponse.Mapped<'player'>>): boolean => {
  const { frameworkUpdates, playabilityStatus, videoDetails } = data

  if (downloadButtonContext != null) {
    forceDownloadVideoIds.delete(downloadButtonContext.videoId)
    downloadButtonContext = null
  }

  const videoId = videoDetails?.videoId
  if (playabilityStatus?.status !== 'OK' || videoId == null) return true

  const mutations = frameworkUpdates?.entityBatchUpdate?.mutations
  if (!videoDetails?.isLive && Array.isArray(mutations)) {
    const entity = mutations.map(mutation => mutation.payload?.offlineabilityEntity).find(entity => entity != null)
    if (entity?.key == null || entity.offlineabilityRenderer != null) return true

    downloadButtonContext = {
      videoId,
      entityKey: entity.key
    }
    forceDownloadVideoIds.add(videoId)

    entity.addToOfflineButtonState = YTRenderer.enums.AddToOfflineButtonState.ADD_TO_OFFLINE_BUTTON_STATE_ENABLED
    entity.offlineable = true
    entity.contentCheckOk = true
    entity.racyCheckOk = true
    delete entity.command
  }

  return true
}

export const markYTForceDownloadVideo = (videoId: string): void => {
  forceDownloadVideoIds.add(videoId)
}

export default class YTMiscsDownloadModule extends Feature {
  public constructor() {
    super('download')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTRenderer.mapped.playlistVideoListRenderer, processPlaylistVideoListRenderer)
    registerYTValueProcessor(YTRenderer.mapped.topbarLogoRenderer, processTopbarLogoRenderer)
    registerYTValueProcessor(YTRenderer.mapped.videoOwnerRenderer, processVideoOwnerRenderer)
    registerYTValueProcessor(YTRenderer.mapped.videoPrimaryInfoRenderer, updateVideoPrimaryInfoRenderer)
    registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)

    registerYTInnertubeRequestProcessor('offline', async ({ context, playlistIds, videoIds }) => {
      if (Array.isArray(playlistIds) && !isPremium) {
        return { playlists: await batchFetchOfflinePlaylistData(playlistIds, context) }
      }

      if (Array.isArray(videoIds) && (!isPremium || videoIds.some(id => forceDownloadVideoIds.has(id)))) {
        return { videos: await batchFetchOfflineVideoData(videoIds, context) }
      }

      logger.debug('using premium offline request')
    })
    registerYTInnertubeRequestProcessor('offline/get_download_action', ({ preferredFormatType, videoId }) => {
      if (isPremium && !forceDownloadVideoIds.has(videoId!)) {
        logger.debug('using premium offline action request')
        return
      }

      const downloadQualityPickerEntityKey = encodeEntityKey({ entityId: videoId, entityType: EntityType.downloadQualityPickerEntity })

      return {
        onResponseReceivedCommand: {
          commandExecutorCommand: {
            commands: [
              {
                openPopupAction: {
                  popup: {
                    downloadQualitySelectorRenderer: {
                      downloadQualityPickerEntityKey,
                      onSubmitEndpoint: {
                        offlineVideoEndpoint: {
                          videoId,
                          action: 'ACTION_ADD',
                          actionParams: {
                            formatType: (preferredFormatType as YTCommon.enums.OfflineFormatType) ?? 'UNKNOWN_FORMAT_TYPE',
                            settingsAction: 'DOWNLOAD_QUALITY_SETTINGS_ACTION_SAVE'
                          }
                        }
                      }
                    }
                  },
                  popupType: 'DIALOG',
                  replacePopup: true
                }
              },
              { signalAction: { signal: 'REQUEST_PERSISTENT_STORAGE' } }
            ]
          }
        },
        frameworkUpdates: {
          entityBatchUpdate: {
            mutations: [
              {
                entityKey: downloadQualityPickerEntityKey,
                type: 'ENTITY_MUTATION_TYPE_REPLACE',
                payload: {
                  downloadQualityPickerEntity: {
                    formats: [
                      buildDownloadQualityFormat('HD_1080', 'Full HD (1080p)'),
                      buildDownloadQualityFormat('HD', 'High (720p)'),
                      buildDownloadQualityFormat('SD', 'Medium (360p)'),
                      buildDownloadQualityFormat('LD', 'Low (144p)')
                    ],
                    key: downloadQualityPickerEntityKey,
                    rememberSettingString: 'Remember settings'
                  }
                }
              }
            ],
            timestamp: { seconds: `${floor(Date.now() / 1e3)}`, nanos: 0 }
          }
        }
      }
    })
    registerYTInnertubeRequestProcessor('offline/get_playback_data_entity', async ({ context, videos }) => {
      if (!Array.isArray(videos) || (isPremium && !videos.some(({ entityKey }) => forceDownloadVideoIds.has(decodeEntityKey(entityKey).entityId!)))) return

      const now = floor(Date.now() / 1e3)
      const offlineState = new OfflineState({
        token: `${DOWNLOAD_ID_PREFIX}state`,
        refreshInSeconds: 0,
        expiresInSeconds: 0,
        action: OfflineStateAction.OK,
        isOfflineSharingAllowed: true
      })

      const orchestrationActions: YTValueData<YTResponse.Mapped<'offlineGetPlaybackDataEntity'>>['orchestrationActions'] = []
      const mutations: YTValueData<YTEndpoint.Component<'entityMutation'>>[] = []

      await Promise.all(videos.map(async ({ entityKey, downloadParameters }) => {
        const videoId = decodeEntityKey(entityKey).entityId
        if (videoId == null) return

        const contextEntityKey = encodeEntityKey({ entityId: videoId, entityType: EntityType.videoDownloadContextEntity, isPersistent: true })
        const policyEntityKey = encodeEntityKey({ entityId: videoId, entityType: EntityType.offlineVideoPolicy, isPersistent: true })
        const transferEntityKey = encodeEntityKey({ entityId: videoId, entityType: EntityType.transfer, isPersistent: true })

        const { response } = await fetchInnertubeVideo(videoId, context)
        const { playabilityStatus, playerConfig, streamingData } = response

        const ustreamerConfig = playerConfig?.mediaCommonConfig?.mediaUstreamerRequestConfig?.videoPlaybackUstreamerConfig
        if (ustreamerConfig != null && streamingData != null) {
          const { adaptiveFormats, serverAbrStreamingUrl } = streamingData

          if (Array.isArray(adaptiveFormats) && serverAbrStreamingUrl != null) {
            const formats = adaptiveFormats
              .filter(({ audioQuality, itag, quality }) => itag != null && (audioQuality != null || quality != null))
              .map<SabrFormatInfo>(({
                approxDurationMs,
                audioQuality,
                contentLength,
                itag,
                lastModified,
                quality,
                xtags
              }) => ({
                itag: itag!,
                contentLength: String(contentLength ?? 0),
                lastModified: String(lastModified ?? 0),
                duration: String(approxDurationMs ?? 0),
                xtags: xtags ?? '',
                audioQuality: YTCommon.enums.MediaFormatAudioQuality[audioQuality!],
                videoQuality: YTCommon.enums.MediaFormatVideoQuality[quality!]
              }))

            const formatUrl = new URL(serverAbrStreamingUrl)
            const { searchParams } = formatUrl

            searchParams.set(SNAPSHOT_PARAM_NAME, JSON.stringify({
              videoId,
              params: Array.from(searchParams.keys()),
              ustreamerConfig,
              formats
            } satisfies PlaybackDataSnapshot))

            for (const format of adaptiveFormats) {
              if (format.itag == null) continue

              searchParams.set('itag', String(format.itag))
              format.url ??= formatUrl.toString()
            }
          }
        }

        orchestrationActions.push({
          actionType: 'OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD',
          actionMetadata: {
            priority: 1,
            transferEntityActionMetadata: {
              maximumDownloadQuality: downloadParameters?.maximumDownloadQuality ?? 'HD_1080',
              isEnqueuedForPes: true
            }
          },
          entityKey: transferEntityKey
        })
        mutations.push(
          {
            entityKey,
            type: 'ENTITY_MUTATION_TYPE_REPLACE',
            payload: {
              playbackData: {
                key: entityKey,
                offlineVideoPolicy: policyEntityKey,
                playerResponseJson: JSON.stringify(response),
                playerResponsePlayabilityCanPlayStatus: playabilityStatus?.status,
                playerResponseTimestamp: `${now}`,
                streamDownloadTimestampSeconds: `${now}`,
                transfer: transferEntityKey,
                videoDownloadContextEntity: contextEntityKey
              }
            },
            options: {
              persistenceOption: 'ENTITY_PERSISTENCE_OPTION_PERSIST'
            }
          },
          {
            entityKey: policyEntityKey,
            type: 'ENTITY_MUTATION_TYPE_REPLACE',
            payload: {
              offlineVideoPolicy: {
                key: policyEntityKey,
                action: 'OFFLINE_VIDEO_POLICY_ACTION_OK',
                offlineStateBytes: bufferToString(offlineState.serialize(), 'base64'),
                expirationTimestamp: 'Infinity',
                lastUpdatedTimestampSeconds: 'Infinity'
              }
            },
            options: {
              persistenceOption: 'ENTITY_PERSISTENCE_OPTION_PERSIST'
            }
          }
        )
        forceDownloadVideoIds.delete(videoId)
      }))

      return {
        orchestrationActions,
        frameworkUpdates: {
          entityBatchUpdate: {
            mutations,
            timestamp: { seconds: `${now}`, nanos: 0 }
          }
        }
      }
    })
    registerYTInnertubeRequestProcessor('offline/offline_video_playback_position_sync', () => {
      if (!isPremium) return {}
    })
    registerYTInnertubeRequestProcessor('offline/playlist_sync_check', () => {
      if (!isPremium) return {}
    })
    registerYTInnertubeRequestProcessor('player', ({ playbackContext }) => {
      if (playbackContext?.devicePlaybackCapabilities == null) return

      devicePlaybackCapabilities = { ...playbackContext.devicePlaybackCapabilities }
    })

    addInterceptNetworkCallback(async ctx => {
      if (ctx.state === NetworkState.UNSENT) await processRequest(ctx)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}