import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn, YTPolymerCreateCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
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

const filterGuideEntry = (data: YTValueData<YTRenderer.Mapped<'guideEntryRenderer'>>): boolean => {
  const browseId = data.navigationEndpoint?.browseEndpoint?.browseId ?? ''

  // Remove premium promotion
  if (browseId === 'SPunlimited' || data.navigationEndpoint?.urlEndpoint != null) return false

  // Remove shorts guide entry
  if (isYTFeedFilterEnable(YTFeedFilterMask.SHORTS) && data.serviceEndpoint?.reelWatchEndpoint != null) return false

  // Hide inaccessible guide entries for guest
  return isYTLoggedIn() || !['FEhistory', 'FElibrary', 'FEsubscriptions', 'SPaccount_overview', 'SPreport_history'].includes(browseId)
}

const updateGuideResponse = (data: YTValueData<YTResponse.Mapped<'guide'>>): void => {
  const { responseContext } = data

  delete responseContext?.maxAgeSeconds

  if (!isYTLoggedIn()) return

  const maxAgeSec = responseContext?.maxAgeSeconds ?? 0
  const nextIntervalSec = (REFRESH_INTERVAL_SEC - ((floor(Date.now() / 1e3) - REFRESH_OFFSET_SEC) % REFRESH_INTERVAL_SEC))
  const nextRefreshSec = max(MIN_REFRESH_SEC, min(maxAgeSec, nextIntervalSec))

  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(reloadYTGuide, nextRefreshSec * 1e3)
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
    YTPolymerCreateCallback.registerCallback(instance => {
      if (!('initializeGuideData' in instance)) return

      guidePolymer = instance as YTGuidePolymer
    })

    registerYTValueFilter(YTRenderer.mapped.guideEntryRenderer, filterGuideEntry)
    registerYTValueFilter(YTRenderer.mapped.guideSigninPromoRenderer)
    registerYTValueProcessor(YTResponse.mapped.guide, updateGuideResponse)

    registerYTSignalActionHandler(YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE, reloadYTGuide)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}