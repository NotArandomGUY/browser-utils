import Lifecycle from '@ext/common/preload/overlay/components/lifecycle'
import { buildClass } from '@ext/common/preload/overlay/style/class'
import { dispatchYTNavigate } from '@ext/custom/youtube/module/core/event'
import { encodeEntityKey, EntityType } from '@ext/custom/youtube/proto/entity-key'
import { getYTLocalEntitiesByType, getYTLocalEntityByKey, YTLocalEntity, YTLocalMediaType } from '@ext/custom/youtube/utils/local'
import { deleteYTOfflineMedia, exportYTOfflineMediaBundle, exportYTOfflineMediaStream, importYTOfflineMediaBundle } from '@ext/custom/youtube/utils/ytom'
import { PromiseWithProgress } from '@ext/lib/async'
import van, { ChildDom, State } from 'vanjs-core'

const { button, div, h1, input, p, table, tbody, td, th, thead, tr } = van.tags

const FLEX_ITEM_GROW_STYLE = 'flex-grow:1'
const SINGLE_LINE_COLUMN = { style: 'width:.1%;white-space:nowrap;text-align:left!important' }

const enum ExportFormat {
  BUNDLE,
  AUDIO_STREAM,
  VIDEO_STREAM
}

type YTMainVideoEntity = YTLocalEntity<EntityType.mainVideoEntity>['data'] & {
  addedTimestamp: number
  isAutoDownload: boolean
}

const YTMainVideoEntityTableItem = (
  onWatch: (id: string) => void,
  onExport: (id: string, format: ExportFormat) => void,
  onDelete: (id: string) => void,
  { title, videoId, addedTimestamp, isAutoDownload }: YTMainVideoEntity
): ChildDom => {
  return tr(
    td(SINGLE_LINE_COLUMN, `${isAutoDownload ? '[Auto] ' : ''}${videoId ?? '-'}`),
    td({ style: 'cursor:pointer;text-decoration:underline', onclick: onWatch.bind(null, videoId) }, title ?? '-'),
    td(SINGLE_LINE_COLUMN, new Date(addedTimestamp).toLocaleString()),
    td(
      SINGLE_LINE_COLUMN,
      button({ onclick: onExport.bind(null, videoId, ExportFormat.BUNDLE) }, 'Bundle'),
      button({ onclick: onExport.bind(null, videoId, ExportFormat.AUDIO_STREAM) }, 'Audio'),
      button({ onclick: onExport.bind(null, videoId, ExportFormat.VIDEO_STREAM) }, 'Video')
    ),
    td(SINGLE_LINE_COLUMN, button({ onclick: onDelete.bind(null, videoId) }, 'Delete'))
  )
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
  private readonly mainVideoEntities_: State<YTMainVideoEntity[]>
  private readonly password_: State<string>
  private readonly status_: State<string>
  private refreshTimer_: ReturnType<typeof setInterval> | null

  public constructor() {
    super()

    this.fileInput_ = input({ style: 'display:none', type: 'file', accept: '.ytom' })
    this.mainVideoEntities_ = van.state([])
    this.password_ = van.state('')
    this.status_ = van.state('-')
    this.refreshTimer_ = null
  }

  protected override onCreate(): void {
    const { classList, fileInput_, mainVideoEntities_, password_, status_ } = this

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
            addedTimestamp: downloadState?.data.downloadStatusEntity.downloadState === 'DOWNLOAD_STATE_COMPLETE' ? Number(downloadState.data.addedTimestampMillis) : -1,
            isAutoDownload: downloadContext?.data.offlineModeType === 'OFFLINE_MODE_TYPE_AUTO_OFFLINE'
          }
        })))
        .then(entities => {
          mainVideoEntities_.val = entities.filter(entity => entity.addedTimestamp >= 0).sort((l, r) => (
            l.isAutoDownload === r.isAutoDownload ?
              (r.addedTimestamp - l.addedTimestamp) :
              (l.isAutoDownload ? 1 : -1)
          ))
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
      promiseStatus(deleteYTOfflineMedia(id)).finally(refreshTable)
    }

    this.refreshTimer_ = setInterval(refreshTable, 60e3)
    refreshTable()

    fileInput_.onchange = handleImportFile

    van.add(
      this,
      h1('Downloaded Videos'),
      div(
        { style: 'display:flex;flex-direction:row;align-items:center;gap:0.5em' },
        button({ onclick: refreshTable }, 'Refresh'),
        button({ onclick: handleImport }, 'Import Bundle'),
        input({ style: FLEX_ITEM_GROW_STYLE, placeholder: 'Bundle password (Optional)', value: password_, oninput: e => password_.val = e.target.value }),
        p({ style: FLEX_ITEM_GROW_STYLE }, () => `Status: ${status_.val}`)
      ),
      table(
        thead(tr(th('ID'), th('Title'), th('Added On'), th('Export As'), th('Action'))),
        () => tbody(
          mainVideoEntities_.val.length > 0 ?
            mainVideoEntities_.val.map(YTMainVideoEntityTableItem.bind(null, handleWatch, handleExport, handleDelete)) :
            tr(td({ colSpan: 5 }, 'Videos you download will appear here'))
        )
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