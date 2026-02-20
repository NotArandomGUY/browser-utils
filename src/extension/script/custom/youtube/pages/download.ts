import Lifecycle from '@ext/common/preload/overlay/components/lifecycle'
import { buildClass } from '@ext/common/preload/overlay/style/class'
import { executeYTCommand } from '@ext/custom/youtube/module/core/command'
import { markYTForceDownloadVideo } from '@ext/custom/youtube/module/miscs/download'
import { decodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { getYTLocalEntitiesByType, getYTLocalEntityByKey, getYTLocalEntityByType, YTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { deleteYTOfflineMedia, exportYTOfflineMediaBundle, exportYTOfflineMediaStream, importYTOfflineMediaBundle } from '@ext/custom/youtube/utils/ytom'
import { PromiseWithProgress, waitAllBatched } from '@ext/lib/async'
import van, { ChildDom, State } from 'vanjs-core'

const { button, div, h1, h4, input, p, table, tbody, td, th, thead, tr } = van.tags

const ENTITY_PROCESS_INIT_BATCH_SIZE = 5
const ENTITY_PROCESS_CONT_BATCH_SIZE = 50
const COPY_TEXT_TOOLTIP = 'Click to Copy'
const COLUMN_TITLES = ['Title', 'ID', 'Channel', 'Playlist', 'Added On'] as const
const STYLE_FLEX_CONTAINER = 'display:flex;flex-direction:row;gap:0.5em'
const STYLE_FLEX_ITEM_GROW = 'flex-grow:1'
const STYLE_TEXT_SHRINK = 'width:.1%;white-space:nowrap'
const COLUMN_PROPS_ACTION_HEAD = { style: STYLE_TEXT_SHRINK }
const COLUMN_PROPS_ACTION_BODY = { style: STYLE_TEXT_SHRINK, rowSpan: 2 }
const COLUMN_PROPS_INFO_HEAD = { colSpan: 4 }
const COLUMN_PROPS_INFO_TITLE = { style: 'cursor:pointer', colSpan: 4, title: COPY_TEXT_TOOLTIP, onclick: copyEventTarget }
const COLUMN_PROPS_INFO_SMALL = { style: 'cursor:pointer;width:18.75%;white-space:nowrap', title: COPY_TEXT_TOOLTIP, onclick: copyEventTarget }

const enum ExportFormat {
  BUNDLE,
  AUDIO_STREAM,
  VIDEO_STREAM,
  MERGED
}

type VideoEntity = Partial<Omit<YTLocalEntity<EntityType.mainVideoEntity>['data'], 'videoId'>> & {
  videoId: string
  playlistId: string
  playlistTitle: string
  timestamp: number
  addedOn: string
  auto: boolean
}

function copyEventTarget(event: Event): void {
  const { target } = event

  if (target instanceof HTMLElement) navigator.clipboard?.writeText(target.innerText)
}

const isValidSource = (source: string | null | undefined, index: number): boolean => {
  return index > 0 && !!source?.trim()
}

const isFilteredVideo = (filter: string, { owner, title, videoId, playlistId, playlistTitle, addedOn }: VideoEntity): boolean => {
  const search = [title, videoId, owner, playlistTitle, addedOn, playlistId]
  return !filter || search.some((value, i) => `${COLUMN_TITLES[i] ?? ''}:"${value}"`.toLowerCase().includes(filter))
}

const VideoEntityTableItem = (
  onWatch: (videoId: string, playlistId: string) => void,
  onExport: (id: string, format: ExportFormat) => void,
  onDelete: (id: string) => void,
  { owner, title, videoId, playlistId, playlistTitle, addedOn }: VideoEntity
): ChildDom[] => {
  return [
    tr(
      td(COLUMN_PROPS_INFO_TITLE, title ?? '-'),
      td(
        COLUMN_PROPS_ACTION_BODY,
        button({ onclick: () => { onExport(videoId, ExportFormat.BUNDLE) } }, 'Bundle'),
        button({ onclick: () => { onExport(videoId, ExportFormat.AUDIO_STREAM) } }, 'Audio'),
        button({ onclick: () => { onExport(videoId, ExportFormat.VIDEO_STREAM) } }, 'Video'),
        button({ onclick: () => { onExport(videoId, ExportFormat.MERGED) } }, 'MP4')
      ),
      td(
        COLUMN_PROPS_ACTION_BODY,
        button({ onclick: () => { onWatch(videoId, playlistId) } }, 'Watch'),
        button({ onclick: () => { onDelete(videoId) } }, 'Delete')
      )
    ),
    tr(
      td(COLUMN_PROPS_INFO_SMALL, videoId),
      td(COLUMN_PROPS_INFO_SMALL, owner ?? '-'),
      td(COLUMN_PROPS_INFO_SMALL, playlistTitle),
      td(COLUMN_PROPS_INFO_SMALL, addedOn)
    )
  ]
}

class YTDownloadPageLifecycle extends Lifecycle<void> {
  private static readonly ID = Lifecycle.getId('yt-offline-page')

  public static override define(): void {
    Lifecycle.define(YTDownloadPageLifecycle, YTDownloadPageLifecycle.ID)
  }

  public static override create(): YTDownloadPageLifecycle {
    return Lifecycle.create({}, YTDownloadPageLifecycle.ID) as YTDownloadPageLifecycle
  }

  private readonly fileInput_: HTMLInputElement
  private readonly videoEntities_: State<VideoEntity[]>
  private readonly isLoading_: State<boolean>
  private readonly password_: State<string>
  private readonly status_: State<string>
  private readonly downloadSource_: State<string>
  private readonly filter_: State<string>
  private refreshTimer_: ReturnType<typeof setInterval> | null

  public constructor() {
    super()

    this.fileInput_ = input({ style: 'display:none', type: 'file', accept: '.ytom' })
    this.videoEntities_ = van.state([])
    this.isLoading_ = van.state(false)
    this.password_ = van.state('')
    this.status_ = van.state('-')
    this.downloadSource_ = van.state('')
    this.filter_ = van.state('')
    this.refreshTimer_ = null
  }

  protected override onCreate(): void {
    const { classList, fileInput_, videoEntities_, isLoading_, password_, status_, downloadSource_, filter_ } = this

    const className = buildClass(['bu-overlay', 'page'])
    classList.add(className)

    const promiseStatus = async (promise: Promise<void> | PromiseWithProgress<void, string>): Promise<void> => {
      if (promise instanceof PromiseWithProgress) promise.progress(progress => status_.val = progress)

      return promise.catch(error => {
        status_.val = error instanceof Error ? error.message : String(error)
      })
    }

    const refreshTable = async (): Promise<void> => {
      if (isLoading_.val) return

      try {
        isLoading_.val = true

        const [mainDownloadsListEntity, mainPlaylistEntities, mainVideoEntities] = await Promise.all([
          getYTLocalEntityByType(EntityType.mainDownloadsListEntity, true),
          getYTLocalEntitiesByType(EntityType.mainPlaylistEntity, true),
          getYTLocalEntitiesByType(EntityType.mainVideoEntity, true)
        ])
        const playlistMap = new Map(mainPlaylistEntities.flatMap(({ data }) => Array.from(data.videos ?? []).map(key => [
          String(JSON.parse(decodeEntityKey(key).entityId ?? 'null')?.videoId),
          data
        ])))

        const processEntity = async ({ key, data }: YTLocalEntity<EntityType.mainVideoEntity>): Promise<void> => {
          const playlist = playlistMap.get(data.videoId)
          const [channel, downloadState] = await Promise.all([
            getYTLocalEntityByKey<EntityType.ytMainChannelEntity>(data.owner, true),
            getYTLocalEntityByKey<EntityType.mainVideoDownloadStateEntity>(data.downloadState, true)
          ])

          const timestamp = downloadState?.data.downloadStatusEntity.downloadState === 'DOWNLOAD_STATE_COMPLETE' ? Number(downloadState.data.addedTimestampMillis) : -1
          if (timestamp < 0) return

          const auto = !!mainDownloadsListEntity?.data.downloads?.some(({ videoItem }) => videoItem === key)
          videoEntities_.val.push({
            ...data,
            owner: channel?.data.title,
            playlistId: playlist?.playlistId ?? 'PPSV',
            playlistTitle: playlist?.title ?? (auto ? 'Smart Downloads' : 'Your Downloads'),
            timestamp,
            addedOn: new Date(timestamp).toLocaleString(),
            auto
          })
        }

        const entities = mainVideoEntities.filter(({ data }) => !videoEntities_.val.some(entity => data.videoId === entity.videoId))
        await waitAllBatched(entities.map(entity => processEntity.bind(null, entity)), ENTITY_PROCESS_INIT_BATCH_SIZE, ENTITY_PROCESS_CONT_BATCH_SIZE).progress(() => {
          videoEntities_.val = videoEntities_.val.slice().sort((l, r) => (
            l.auto === r.auto ?
              (r.timestamp - l.timestamp) :
              (l.auto ? 1 : -1) // NOSONAR
          ))
        })
      } catch (error) {
        status_.val = error instanceof Error ? error.message : String(error)
      } finally {
        isLoading_.val = false
      }
    }

    const handleWatch = (videoId: string, playlistId: string): void => {
      executeYTCommand({
        commandMetadata: {
          webCommandMetadata: {
            url: `/watch?v=${videoId}&list=${playlistId}`,
            rootVe: 3832,
            webPageType: 'WEB_PAGE_TYPE_WATCH'
          }
        },
        watchEndpoint: {
          videoId,
          playlistId
        }
      })
    }

    const handleImportFile = (): void => {
      const { files } = fileInput_

      const file = files?.[0]
      if (file == null) return

      promiseStatus(importYTOfflineMediaBundle(file, password_.val)).finally(refreshTable)
      fileInput_.value = ''
    }

    const handleImport = (): void => {
      fileInput_.click()
    }

    const handleExport = async (id: string, format: ExportFormat): Promise<void> => {
      switch (format) {
        case ExportFormat.BUNDLE:
          return promiseStatus(exportYTOfflineMediaBundle(id, password_.val))
        case ExportFormat.AUDIO_STREAM:
          return promiseStatus(exportYTOfflineMediaStream(id, YTLocalMediaType.AUDIO))
        case ExportFormat.VIDEO_STREAM:
          return promiseStatus(exportYTOfflineMediaStream(id, YTLocalMediaType.VIDEO))
        case ExportFormat.MERGED:
          return promiseStatus(exportYTOfflineMediaStream(id, YTLocalMediaType.AUDIO_AND_VIDEO))
        default:
          status_.val = 'invalid export format'
      }
    }

    const handleExportFiltered = async (format: ExportFormat): Promise<void> => {
      const entities = videoEntities_.val.filter(isFilteredVideo.bind(null, filter_.val.trim().toLowerCase()))
      if (entities.length === 0 || !confirm(`Export ${entities.length} downloaded videos?`)) return

      for (const entity of entities) await handleExport(entity.videoId, format)
    }

    const handleDelete = (id: string): void => {
      if (!confirm(`Confirm delete video '${id}'?`)) return

      isLoading_.val = true
      promiseStatus(deleteYTOfflineMedia(id)).then(() => {
        const entities = videoEntities_.val
        const index = entities.findIndex(entity => entity.videoId === id)
        if (index >= 0) videoEntities_.val = entities.slice(0, index).concat(entities.slice(index + 1))
      }).catch(error => {
        status_.val = error instanceof Error ? error.message : String(error)
      }).finally(() => {
        isLoading_.val = false
      })
    }

    const handleQueueDownload = (): void => {
      const sources: [input: string, video?: string | null, playlist?: string | null] = [downloadSource_.val]
      try {
        const { protocol, host, pathname, searchParams } = new URL(sources[0])
        switch (host) {
          case 'youtu.be':
            sources[1] = pathname.split('/')[1]
            break
          case 'youtube.com':
          case 'www.youtube.com':
            if (pathname.startsWith('/live/')) {
              sources[1] = pathname.split('/')[2]
            } else {
              sources[1] = searchParams.get('v')
              sources[2] = searchParams.get('list')
            }
            break
          default:
            if (protocol !== 'ytdl:') break

            sources[1] = pathname
            markYTForceDownloadVideo(pathname)
            break
        }
      } catch {
        sources[2] = sources[1] = sources[0]
      }
      if (!sources.some(isValidSource)) return

      let idx = sources.filter(isValidSource).length === 1 ? sources.findIndex(isValidSource) : -1
      while (idx < 0) {
        idx = Number(prompt('Download type: 1=Video 2=Playlist', '0'))
        if (!sources[idx]?.trim()) idx = 0
      }

      const source = sources[idx]?.trim()
      if (idx <= 0 || !source) return

      switch (idx) {
        case 1:
          executeYTCommand({
            offlineVideoEndpoint: {
              action: 'ACTION_ADD',
              actionParams: { formatType: 'HD_1080', settingsAction: 'DOWNLOAD_QUALITY_SETTINGS_ACTION_DONT_SAVE' },
              videoId: source
            }
          })
          break
        case 2:
          executeYTCommand({
            offlinePlaylistEndpoint: {
              action: 'ACTION_ADD',
              actionParams: { formatType: 'HD_1080', settingsAction: 'DOWNLOAD_QUALITY_SETTINGS_ACTION_DONT_SAVE' },
              playlistId: source
            }
          })
          break
      }
      downloadSource_.val = ''
    }

    this.refreshTimer_ = setInterval(refreshTable, 60e3)
    refreshTable()

    fileInput_.onchange = handleImportFile

    van.add(
      this,
      h1('Import/Export'),
      div(
        { style: `${STYLE_FLEX_CONTAINER};flex-basis:50%` },
        div(
          { className, style: STYLE_FLEX_ITEM_GROW },
          h4('Import Video'),
          div(
            { style: STYLE_FLEX_CONTAINER },
            button({ onclick: handleImport }, 'Import Bundle')
          ),
          h4(() => {
            const entities = videoEntities_.val.filter(isFilteredVideo.bind(null, filter_.val.trim().toLowerCase()))
            return `Export All (${entities.length} total)`
          }),
          div(
            { style: STYLE_FLEX_CONTAINER },
            button({ onclick: () => { handleExportFiltered(ExportFormat.BUNDLE) } }, 'Bundle'),
            button({ onclick: () => { handleExportFiltered(ExportFormat.AUDIO_STREAM) } }, 'Audio'),
            button({ onclick: () => { handleExportFiltered(ExportFormat.VIDEO_STREAM) } }, 'Video'),
            button({ onclick: () => { handleExportFiltered(ExportFormat.MERGED) } }, 'MP4')
          ),
          p(() => `Status: ${status_.val}`)
        ),
        div(
          { className, style: STYLE_FLEX_ITEM_GROW },
          h4('Options'),
          input({ placeholder: 'Bundle Password (Optional)', value: password_, oninput: e => password_.val = e.target.value }),
        )
      ),
      h1('Download'),
      div(
        { style: STYLE_FLEX_CONTAINER },
        input({ placeholder: 'URL/ID', value: downloadSource_, oninput: e => downloadSource_.val = e.target.value }),
        button({ onclick: handleQueueDownload }, 'Queue Download')
      ),
      h1('Available Videos'),
      input({ placeholder: 'Filter, for specific column (use: [column]:"value") (example: title:"Me at the zoo")', value: filter_, oninput: e => filter_.val = e.target.value }),
      table(
        thead(tr(
          th(COLUMN_PROPS_INFO_HEAD, COLUMN_TITLES.join(' / ')),
          th(COLUMN_PROPS_ACTION_HEAD, 'Export As'),
          th(COLUMN_PROPS_ACTION_HEAD, button({ disabled: () => isLoading_.val, onclick: () => void refreshTable() }, 'Refresh'))
        )),
        () => {
          const filter = filter_.val.trim().toLowerCase()
          const entities = videoEntities_.val.filter(isFilteredVideo.bind(null, filter))
          return tbody(
            entities.length > 0 ?
              entities.flatMap(VideoEntityTableItem.bind(null, handleWatch, handleExport, handleDelete)) :
              tr(td({ colSpan: 6 }, () => {
                if (isLoading_.val) return 'Loading...'
                if (filter) return 'No results'
                return 'Videos you download/import will appear here'
              }))
          )
        }
      ),
      fileInput_
    )
  }

  protected override onDestroy(): void {
    const { refreshTimer_ } = this

    if (refreshTimer_ != null) {
      clearInterval(refreshTimer_)
      this.refreshTimer_ = null
    }
  }
}

YTDownloadPageLifecycle.define()

const YTDownloadPage = YTDownloadPageLifecycle.create

export default YTDownloadPage