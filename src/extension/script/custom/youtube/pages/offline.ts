import Lifecycle from '@ext/common/preload/overlay/components/lifecycle'
import { buildClass } from '@ext/common/preload/overlay/style/class'
import { dispatchYTAction, dispatchYTNavigate } from '@ext/custom/youtube/module/core/event'
import { encodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { getYTLocalEntitiesByType, getYTLocalEntityByKey, YTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { deleteYTOfflineMedia, exportYTOfflineMediaBundle, exportYTOfflineMediaStream, importYTOfflineMediaBundle } from '@ext/custom/youtube/utils/ytom'
import { PromiseWithProgress } from '@ext/lib/async'
import van, { ChildDom, State } from 'vanjs-core'

const { button, div, h1, h4, input, p, table, tbody, td, th, thead, tr } = van.tags

const COPY_TEXT_TOOLTIP = 'Click to Copy'
const STYLE_FLEX_CONTAINER = 'display:flex;flex-direction:row;gap:0.5em'
const STYLE_FLEX_ITEM_GROW = 'flex-grow:1'
const STYLE_TEXT_SHRINK = 'width:.1%;white-space:nowrap'
const COLUMN_PROPS_ACTION_HEAD = { style: STYLE_TEXT_SHRINK }
const COLUMN_PROPS_ACTION_BODY = { style: STYLE_TEXT_SHRINK, rowSpan: 2 }
const COLUMN_PROPS_INFO_HEAD = { colSpan: 3 }
const COLUMN_PROPS_INFO_TITLE = { style: 'cursor:pointer', colSpan: 3, title: COPY_TEXT_TOOLTIP, onclick: copyEventTarget }
const COLUMN_PROPS_INFO_SMALL = { style: 'cursor:pointer;width:25%;white-space:nowrap', title: COPY_TEXT_TOOLTIP, onclick: copyEventTarget }

const enum ExportFormat {
  BUNDLE,
  AUDIO_STREAM,
  VIDEO_STREAM
}

type YTMainVideoEntity = Partial<YTLocalEntity<EntityType.mainVideoEntity>['data']> & {
  addedTimestamp: number
  isAutoDownload: boolean
}

function copyEventTarget(event: Event): void {
  const { target } = event

  if (target instanceof HTMLElement) navigator.clipboard?.writeText(target.innerText)
}

const YTMainVideoEntityTableItem = (
  filter: string,
  onWatch: (id: string) => void,
  onExport: (id: string, format: ExportFormat) => void,
  onDelete: (id: string) => void,
  { owner, title, videoId, addedTimestamp, isAutoDownload }: YTMainVideoEntity
): ChildDom[] => {
  const type = isAutoDownload ? 'Auto' : 'Manual'
  const timestamp = new Date(addedTimestamp).toLocaleString()
  const search = [owner, title, videoId, type, timestamp]

  if (videoId == null || (filter && !search.some(part => `"${part}"`.toLowerCase().includes(filter)))) return []

  return [
    tr(
      td(COLUMN_PROPS_INFO_TITLE, title ?? '-'),
      td(
        COLUMN_PROPS_ACTION_BODY,
        button({ onclick: onExport.bind(null, videoId, ExportFormat.BUNDLE) }, 'Bundle'),
        button({ onclick: onExport.bind(null, videoId, ExportFormat.AUDIO_STREAM) }, 'Audio'),
        button({ onclick: onExport.bind(null, videoId, ExportFormat.VIDEO_STREAM) }, 'Video')
      ),
      td(
        COLUMN_PROPS_ACTION_BODY,
        button({ onclick: onWatch.bind(null, videoId) }, 'Watch'),
        button({ onclick: onDelete.bind(null, videoId) }, 'Delete')
      )
    ),
    tr(
      td(COLUMN_PROPS_INFO_SMALL, videoId ?? '-'),
      td(COLUMN_PROPS_INFO_SMALL, owner ?? '-'),
      td(COLUMN_PROPS_INFO_SMALL, `[${type}] ${timestamp}`)
    )
  ]
}

class YTOfflinePageLifecycle extends Lifecycle<void> {
  private static readonly ID = Lifecycle.getId('yt-offline-page')

  public static override define(): void {
    Lifecycle.define(YTOfflinePageLifecycle, YTOfflinePageLifecycle.ID)
  }

  public static override create(): YTOfflinePageLifecycle {
    return Lifecycle.create({}, YTOfflinePageLifecycle.ID) as YTOfflinePageLifecycle
  }

  private readonly fileInput_: HTMLInputElement
  private readonly mainVideoEntities_: State<YTMainVideoEntity[] | null>
  private readonly password_: State<string>
  private readonly status_: State<string>
  private readonly queueVideoId_: State<string>
  private readonly filter_: State<string>
  private refreshTimer_: ReturnType<typeof setInterval> | null

  public constructor() {
    super()

    this.fileInput_ = input({ style: 'display:none', type: 'file', accept: '.ytom' })
    this.mainVideoEntities_ = van.state(null)
    this.password_ = van.state('')
    this.status_ = van.state('-')
    this.queueVideoId_ = van.state('')
    this.filter_ = van.state('')
    this.refreshTimer_ = null
  }

  protected override onCreate(): void {
    const { classList, fileInput_, mainVideoEntities_, password_, status_, queueVideoId_, filter_ } = this

    const className = buildClass(['bu-overlay', 'page'])
    classList.add(className)

    const promiseStatus = async (promise: Promise<void> | PromiseWithProgress<void, string>): Promise<void> => {
      if (promise instanceof PromiseWithProgress) promise.progress(progress => status_.val = progress)

      return promise.catch(error => {
        status_.val = error instanceof Error ? error.message : String(error)
      })
    }

    const refreshTable = (): void => {
      getYTLocalEntitiesByType(EntityType.mainVideoEntity, true)
        .then(entities => Promise.all(entities.map(async ({ data }) => {
          const channel = await getYTLocalEntityByKey<EntityType.ytMainChannelEntity>(data.owner, true)
          const downloadContext = await getYTLocalEntityByKey<EntityType.videoDownloadContextEntity>(encodeEntityKey({
            entityId: data.videoId,
            entityType: EntityType.videoDownloadContextEntity,
            isPersistent: true
          }), true)
          const downloadState = await getYTLocalEntityByKey<EntityType.mainVideoDownloadStateEntity>(data.downloadState ?? encodeEntityKey({
            entityId: data.videoId,
            entityType: EntityType.mainVideoDownloadStateEntity,
            isPersistent: true
          }), true)

          return {
            ...data,
            owner: channel?.data.title,
            addedTimestamp: downloadState?.data.downloadStatusEntity.downloadState === 'DOWNLOAD_STATE_COMPLETE' ? Number(downloadState.data.addedTimestampMillis) : -1,
            isAutoDownload: downloadContext?.data.offlineModeType === 'OFFLINE_MODE_TYPE_AUTO_OFFLINE'
          }
        })))
        .then(entities => {
          mainVideoEntities_.val = entities
            .filter(entity => entity.addedTimestamp >= 0)
            .sort((l, r) => (r.addedTimestamp - l.addedTimestamp) * ((Number(l.isAutoDownload) - Number(r.isAutoDownload)) || 1))
        })
        .catch(error => status_.val = error instanceof Error ? error.message : String(error))
    }

    const handleWatch = (id: string): void => {
      dispatchYTNavigate({
        commandMetadata: {
          webCommandMetadata: {
            url: `/watch?v=${id}&list=PPSV`,
            rootVe: 3832,
            webPageType: 'WEB_PAGE_TYPE_WATCH'
          }
        },
        watchEndpoint: {
          videoId: id,
          playlistId: 'PPSV'
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

    const handleExport = (id: string, format: ExportFormat): void => {
      switch (format) {
        case ExportFormat.BUNDLE:
          promiseStatus(exportYTOfflineMediaBundle(id, password_.val))
          break
        case ExportFormat.AUDIO_STREAM:
          promiseStatus(exportYTOfflineMediaStream(id, YTLocalMediaType.AUDIO))
          break
        case ExportFormat.VIDEO_STREAM:
          promiseStatus(exportYTOfflineMediaStream(id, YTLocalMediaType.VIDEO))
          break
        default:
          status_.val = 'invalid export format'
          break
      }
    }

    const handleDelete = (id: string): void => {
      if (!confirm(`Confirm delete video '${id}'?`)) return

      promiseStatus(deleteYTOfflineMedia(id)).finally(refreshTable)
    }

    const handleQueueDownload = (): void => {
      const videoId = queueVideoId_.val.trim()
      if (videoId.length === 0) return

      dispatchYTAction({
        actionName: 'yt-offline-video-endpoint',
        args: [{
          offlineVideoEndpoint: {
            action: 'ACTION_ADD',
            actionParams: { formatType: 'HD_1080', settingsAction: 'DOWNLOAD_QUALITY_SETTINGS_ACTION_DONT_SAVE' },
            videoId
          }
        }],
        returnValue: []
      })
      queueVideoId_.val = ''
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
          p(() => `Status: ${status_.val}`)
        ),
        div(
          { className, style: STYLE_FLEX_ITEM_GROW },
          h4('Options'),
          input({ placeholder: 'Bundle Password (Optional)', value: password_, oninput: e => password_.val = e.target.value }),
        )
      ),
      h1('Download (Premium Only)'),
      div(
        { style: STYLE_FLEX_CONTAINER },
        input({ placeholder: 'Video ID', value: queueVideoId_, oninput: e => queueVideoId_.val = e.target.value }),
        button({ onclick: handleQueueDownload }, 'Queue Download')
      ),
      h1('Available Videos'),
      input({ placeholder: 'Filter', value: filter_, oninput: e => filter_.val = e.target.value }),
      table(
        thead(tr(
          th(COLUMN_PROPS_INFO_HEAD, 'Title / ID / Channel / [Type] Added On'),
          th(COLUMN_PROPS_ACTION_HEAD, 'Export As'),
          th(COLUMN_PROPS_ACTION_HEAD, button({ onclick: refreshTable }, 'Refresh'))
        )),
        () => {
          const entities = mainVideoEntities_.val
          const filter = filter_.val.trim().toLowerCase()
          return tbody(
            entities?.length ?
              entities.flatMap(YTMainVideoEntityTableItem.bind(null, filter, handleWatch, handleExport, handleDelete)) :
              tr(td({ colSpan: 5 }, entities == null ? 'Loading...' : 'Videos you download will appear here')) // NOSONAR
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

YTOfflinePageLifecycle.define()

const YTOfflinePage = YTOfflinePageLifecycle.create

export default YTOfflinePage