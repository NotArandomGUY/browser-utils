import { Feature } from '@ext/lib/feature'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { registerYTSignalActionHandler } from '@ext/site/youtube/module/core/action'
import { isYTLoggedIn, registerYTPolymerCreateCallback } from '@ext/site/youtube/module/core/bootstrap'
import { isShowShorts } from '@ext/site/youtube/module/feed/filter'

interface YTGuidePolymer {
  guidePromise?: object
  guideRenderers: Set<HTMLElement>

  initializeGuideData(): Promise<void>
  setGuideData(hostElement: HTMLElement): Promise<void>
  setGuideDataAfterInit(hostElement: HTMLElement): void
}

let guidePolymer: YTGuidePolymer | null = null

function filterGuideEntry(data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove premium promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts guide entry
  if (!isShowShorts() && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Hide inaccessible guide entries for guest
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

function updateGuideResponse(data: YTRendererData<YTRenderer<'guideResponse'>>): boolean {
  delete data.responseContext?.maxAgeSeconds

  return true
}

export async function reloadYTGuide(): Promise<void> {
  if (guidePolymer == null) return

  delete guidePolymer.guidePromise

  await guidePolymer.initializeGuideData()

  for (const renderer of guidePolymer.guideRenderers) {
    guidePolymer.setGuideDataAfterInit(renderer)
  }
}

export default class YTFeedGuideModule extends Feature {
  public constructor() {
    super('feed-guide')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['guideResponse'], updateGuideResponse)
    removeYTRendererPre(YTRendererSchemaMap['guideEntryRenderer'], filterGuideEntry)
    removeYTRendererPre(YTRendererSchemaMap['guideSigninPromoRenderer'])

    registerYTPolymerCreateCallback(instance => {
      if (!('initializeGuideData' in instance)) return

      guidePolymer = instance as YTGuidePolymer
    })
    registerYTSignalActionHandler(YTSignalActionType.SOFT_RELOAD_PAGE, reloadYTGuide)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}