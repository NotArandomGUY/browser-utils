import { processYTResponse } from '@ext/custom/youtube/api/processor'
import { YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { YTPlayerContextConfigCallback } from '@ext/custom/youtube/module/player/bootstrap'
import ClientAbrState from '@ext/custom/youtube/proto/gvs/common/client-abr-state'
import { OnesieHeaderType, OnesieProxyStatus, SabrContextScope, UMPSliceType } from '@ext/custom/youtube/proto/gvs/common/enum'
import HttpHeader from '@ext/custom/youtube/proto/gvs/common/http-header'
import OnesieEncryptedInnertubeRequest from '@ext/custom/youtube/proto/gvs/onesie/encrypted-innertube-request'
import OnesieEncryptedInnertubeResponse from '@ext/custom/youtube/proto/gvs/onesie/encrypted-innertube-response'
import OnesieInnertubeRequest from '@ext/custom/youtube/proto/gvs/onesie/innertube-request'
import OnesieInnertubeResponse from '@ext/custom/youtube/proto/gvs/onesie/innertube-response'
import { InitPlaybackRequest, VideoPlaybackRequest } from '@ext/custom/youtube/proto/gvs/request'
import UMPFormatInitializationMetadata from '@ext/custom/youtube/proto/gvs/ump/format-initialization-metadata'
import UMPFormatSelectionConfig from '@ext/custom/youtube/proto/gvs/ump/format-selection-config'
import UMPMediaHeader from '@ext/custom/youtube/proto/gvs/ump/media-header'
import UMPNextRequestPolicy from '@ext/custom/youtube/proto/gvs/ump/next-request-policy'
import UMPOnesieHeader from '@ext/custom/youtube/proto/gvs/ump/onesie-header'
import UMPPlaybackStartPolicy from '@ext/custom/youtube/proto/gvs/ump/playback-start-policy'
import UMPSabrContextUpdate from '@ext/custom/youtube/proto/gvs/ump/sabr-context-update'
import UMPSabrContextContentAds from '@ext/custom/youtube/proto/gvs/ump/sabr-context/content-ads'
import UMPSabrError from '@ext/custom/youtube/proto/gvs/ump/sabr-error'
import UMPSnackbarMessage from '@ext/custom/youtube/proto/gvs/ump/snackbar-message'
import UMPStreamProtectionStatus from '@ext/custom/youtube/proto/gvs/ump/stream-protection-status'
import { decryptOnesie, encryptOnesie } from '@ext/custom/youtube/utils/crypto'
import { UMPContextManager, UMPSliceFlags } from '@ext/custom/youtube/utils/ump'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { ceil } from '@ext/global/math'
import { assign, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import Callback from '@ext/lib/callback'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, onInterceptNetworkRequest, replaceRequest } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTPLAYER-UMP', true)

const BANDWIDTH_ESTIMATE_DELAY_MS = 5e3
const UMP_PATHNAME_REGEXP = /^\/(init|video)playback$/

let onesieClientKeys: Uint8Array[] = []
let onesieHeader: InstanceType<typeof UMPOnesieHeader> | null = null

export const YTPlayerServerAdDelayCallback = new Callback<[delayMs: number]>()

const manager = new UMPContextManager({
  [UMPSliceType.UNKNOWN]: (data, slice) => {
    logger.trace('slice type:', slice.getType(), data)
  },
  [UMPSliceType.ONESIE_HEADER]: (data) => {
    onesieHeader = new UMPOnesieHeader().deserialize(data)

    logger.trace('onesie header:', onesieHeader)
  },
  [UMPSliceType.ONESIE_DATA]: async (data, slice) => {
    if (onesieHeader == null) {
      logger.warn('onesie data without header')
      slice.setFlag(UMPSliceFlags.DROP)
      return
    }

    const { type, cryptoParams } = onesieHeader

    switch (type) {
      case OnesieHeaderType.PLAYER_RESPONSE: {
        const [decryptedData, key] = await decryptOnesie(data, onesieClientKeys, cryptoParams)
        const message = new OnesieInnertubeResponse().deserialize(decryptedData)

        let body: object | null = null
        if (message.onesiePorxyStatus === OnesieProxyStatus.OK && message.body != null) {
          body = JSON.parse(bufferToString(message.body))
          await processYTResponse('player', body)
          message.body = bufferFromString(JSON.stringify(body))
        }
        logger.debug('onesie player response:', message, body)

        slice.setData(await encryptOnesie(message.serialize(), key, cryptoParams))
        return
      }
      case OnesieHeaderType.ENCRYPTED_INNERTUBE_RESPONSE_PART: {
        logger.debug('onesie encrypted innertube response:', () => new OnesieEncryptedInnertubeResponse().deserialize(data))
        return
      }
      default:
        logger.debug('onesie data type:', type, 'size:', data.length)
        return
    }
  },
  [UMPSliceType.MEDIA_HEADER]: (data) => {
    logger.trace('media header:', () => new UMPMediaHeader().deserialize(data))
  },
  [UMPSliceType.MEDIA]: (data) => {
    logger.trace('media content:', () => {
      return { headerId: data[0], size: data.length - 1 }
    })
  },
  [UMPSliceType.MEDIA_END]: (data) => {
    logger.trace('media end:', () => {
      return { headerId: data[0] }
    })
  },
  [UMPSliceType.NEXT_REQUEST_POLICY]: (data) => {
    logger.trace('next request policy:', () => new UMPNextRequestPolicy().deserialize(data))
  },
  [UMPSliceType.FORMAT_SELECTION_CONFIG]: (data) => {
    logger.trace('format selection config:', () => new UMPFormatSelectionConfig().deserialize(data))
  },
  [UMPSliceType.FORMAT_INITIALIZATION_METADATA]: (data) => {
    logger.trace('format initialization metadata:', () => new UMPFormatInitializationMetadata().deserialize(data))
  },
  [UMPSliceType.SABR_ERROR]: (data) => {
    logger.warn('sabr error:', () => new UMPSabrError().deserialize(data))
  },
  [UMPSliceType.PLAYBACK_START_POLICY]: (data) => {
    logger.trace('playback start policy:', () => new UMPPlaybackStartPolicy().deserialize(data))
  },
  [UMPSliceType.SABR_CONTEXT_UPDATE]: (data) => {
    const message = new UMPSabrContextUpdate().deserialize(data)

    logger.debug('sabr context update:', message)

    const content = message.value?.content
    if (content == null) return

    if (message.type === 5 && message.scope === SabrContextScope.SABR_CONTEXT_SCOPE_CONTENT_ADS) {
      const context = new UMPSabrContextContentAds().deserialize(content)

      const backoffTimeMs = context.backoffTimeMs
      if (!backoffTimeMs) return

      YTPlayerServerAdDelayCallback.invoke(backoffTimeMs)
      ytuiShowToast(`Waiting for server ad delay (${ceil(backoffTimeMs / 1e3)}s)...`, backoffTimeMs)
    }
  },
  [UMPSliceType.STREAM_PROTECTION_STATUS]: (data) => {
    logger.trace('stream protection status:', () => new UMPStreamProtectionStatus().deserialize(data))
  },
  [UMPSliceType.SNACKBAR_MESSAGE]: (data, slice) => {
    logger.debug('snackbar message:', () => new UMPSnackbarMessage().deserialize(data))

    slice.setFlag(UMPSliceFlags.DROP)
  }
})

const getPlaybackRequestId = (params: URLSearchParams): string => {
  return `${params.get('id')}/itag.${params.get('itag')}/rn.${params.get('rn')}/fc.${params.get('fallback_count')}/r.${params.get('range')}`
}

const processClientAbrState = (state: InstanceType<typeof ClientAbrState> | null): void => {
  if (state == null) return

  if (Number(state.elapsedWallTimeMs) < BANDWIDTH_ESTIMATE_DELAY_MS) state.bandwidthEstimate = null
}

const processPlayerContextConfig = (config: YTPlayerWebPlayerContextConfig): void => {
  const clientKey = config.onesieHotConfig?.clientKey
  if (clientKey == null) return

  onesieClientKeys.push(bufferFromString(clientKey, 'base64'))
  logger.debug('load onesie client key:', onesieClientKeys)
}

const processOnesieInnertubeRequest = async (innertubeRequest: InstanceType<typeof OnesieEncryptedInnertubeRequest> | null): Promise<void> => {
  if (innertubeRequest == null) return

  const { encryptedOnesieInnertubeRequest, iv, unencryptedOnesieInnertubeRequest } = innertubeRequest

  let onesieRequest = unencryptedOnesieInnertubeRequest
  let encryptionKey = null

  if (encryptedOnesieInnertubeRequest != null && iv?.length === 16) {
    const [data, key] = await decryptOnesie(encryptedOnesieInnertubeRequest, onesieClientKeys, innertubeRequest)
    onesieRequest = new OnesieInnertubeRequest().deserialize(data)
    encryptionKey = key
  }

  if (onesieRequest == null) {
    logger.warn('empty innertube request')
    return
  }

  const { request } = await onInterceptNetworkRequest(onesieRequest.urls?.[0] ?? location.href, {
    method: 'POST',
    headers: Object.fromEntries(onesieRequest.headers?.map(e => [e.name, e.value]) ?? []),
    body: onesieRequest.body
  })

  onesieRequest.headers = Array.from(request.headers.entries()).map(e => new HttpHeader({ name: e[0].replace(/(^|-)[a-z]/g, c => c.toUpperCase()), value: e[1] }))
  onesieRequest.body = new Uint8Array(await request.arrayBuffer())

  if (encryptionKey != null) {
    innertubeRequest.encryptedOnesieInnertubeRequest = await encryptOnesie(onesieRequest.serialize(), encryptionKey, innertubeRequest)
    innertubeRequest.unencryptedOnesieInnertubeRequest = null
  }
}

const processRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url: { pathname, searchParams }, request } = ctx

  if (searchParams.has('expire')) {
    const ttl = Number(searchParams.get('expire')) - (Date.now() / 1e3)
    if (isNaN(ttl) || ttl < 0 || ttl > 604800) {
      logger.debug('blocked invalid ump request from sending')
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
      return
    }
  }

  try {
    let body = new Uint8Array(await request.arrayBuffer())

    switch (pathname) {
      case '/initplayback': {
        const initPlaybackRequest = new InitPlaybackRequest().deserialize(body)

        logger.debug(`init playback request(${/*@__PURE__*/getPlaybackRequestId(searchParams)}):`, initPlaybackRequest)

        processClientAbrState(initPlaybackRequest.clientAbrState)
        await processOnesieInnertubeRequest(initPlaybackRequest.innertubeRequest)

        body = initPlaybackRequest.serialize()
        break
      }
      case '/videoplayback': {
        const videoPlaybackRequest = new VideoPlaybackRequest().deserialize(body)

        logger.debug(`video playback request(${/*@__PURE__*/getPlaybackRequestId(searchParams)}):`, videoPlaybackRequest)

        processClientAbrState(videoPlaybackRequest.clientAbrState)

        body = videoPlaybackRequest.serialize()
        break
      }
    }

    await replaceRequest(ctx, { body })
  } catch (error) {
    if (error instanceof Response) {
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: error })
      return
    }

    logger.error('process request error:', error)
  }
}

const processResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url: { searchParams }, response: { status, headers, body } } = ctx

  if (body == null || headers.get('content-type') !== 'application/vnd.yt-ump') return

  return new Promise((resolve: (() => void) | null) => {
    ctx.response = new Response(
      new ReadableStream({
        start(controller) {
          logger.debug(`playback response(${/*@__PURE__*/getPlaybackRequestId(searchParams)})`)
          manager.grab(searchParams).feed(body).progress(chunk => {
            if (resolve != null) {
              resolve()
              resolve = null
            }
            controller.enqueue(chunk)
          }).then(() => {
            resolve?.()
            controller.close()
          }).catch(error => {
            if (error instanceof Response) ctx.response = error
            resolve?.()
            controller.error(error instanceof Error ? error : new Error('unknown error'))
          })
        }
      }),
      { status, headers: fromEntries(headers.entries()) }
    )
  })
}

export default class YTPlayerNetworkModule extends Feature {
  public constructor() {
    super('network')
  }

  protected activate(): boolean {
    YTPlayerContextConfigCallback.registerCallback(processPlayerContextConfig)

    addInterceptNetworkCallback(async ctx => {
      const { url } = ctx

      if (url.hostname.startsWith('redirector.') || !UMP_PATHNAME_REGEXP.test(url.pathname)) return

      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processResponse(ctx)
          break
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}