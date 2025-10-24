import { YTSignalActionType } from '@ext/custom/youtube/api/endpoint'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { isYTLoggedIn, registerYTPolymerCreateCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/event'
import { isYTFeedFilterEnable, YTFeedFilterMask } from '@ext/custom/youtube/module/feed/filter'
import { floor, max, min } from '@ext/global/math'
import { Feature } from '@ext/lib/feature'

const REFRESH_INTERVAL_SEC = 15 * 60
const REFRESH_OFFSET_SEC = 60
const MIN_REFRESH_SEC = 30

interface YTGuidePolymer {
  guidePromise?: object
  guideRenderers: Set<HTMLElement>

  initializeGuideData(): Promise<void>
  setGuideData(hostElement: HTMLElement): Promise<void>
  setGuideDataAfterInit(hostElement: HTMLElement): void
}

let guidePolymer: YTGuidePolymer | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

const filterGuideEntry = (data: YTRendererData<YTRenderer<'guideEntryRenderer'>>): boolean => {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove premium promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts guide entry
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Hide inaccessible guide entries for guest
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

const updateGuideResponse = (data: YTRendererData<YTRenderer<'guideResponse'>>): boolean => {
  const { responseContext } = data

  if (isYTLoggedIn()) {
    const maxAgeSec = responseContext?.maxAgeSeconds ?? 0
    const nextIntervalSec = (REFRESH_INTERVAL_SEC - ((floor(Date.now() / 1e3) - REFRESH_OFFSET_SEC) % REFRESH_INTERVAL_SEC))
    const nextRefreshSec = max(MIN_REFRESH_SEC, min(maxAgeSec, nextIntervalSec))

    if (refreshTimer != null) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(reloadYTGuide, nextRefreshSec * 1e3)
  }

  delete responseContext?.maxAgeSeconds

  return true
}

export const reloadYTGuide = async (): Promise<void> => {
  if (guidePolymer == null) return

  if (refreshTimer != null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  delete guidePolymer.guidePromise

  await guidePolymer.initializeGuideData()

  for (const renderer of guidePolymer.guideRenderers) {
    guidePolymer.setGuideDataAfterInit(renderer)
  }
}

export default class YTFeedGuideModule extends Feature {
  public constructor() {
    super('guide')
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