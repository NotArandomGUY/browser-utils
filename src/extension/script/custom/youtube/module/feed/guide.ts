import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { isYTLoggedIn, YTPolymerCreateCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
import { isYTFeedFilterEnable, YTFeedFilterMask } from '@ext/custom/youtube/module/feed/filter'
import { floor, min } from '@ext/global/math'
import { Feature } from '@ext/lib/feature'

const REFRESH_INTERVAL_SEC = 15 * 60
const REFRESH_COOLDOWN_SEC = 15
const REFRESH_OFFSETS = [-30, 0, 30, 60, 120]

interface YTGuideManager {
  guidePromise?: object
  guideRenderers: Set<HTMLElement>

  initializeGuideData(): Promise<void>
  setGuideData(hostElement: HTMLElement): Promise<void>
  setGuideDataAfterInit(hostElement: HTMLElement): void
}

interface YTDGuideCollapsibleEntryRenderer extends HTMLElement {
  expanded?: boolean

  onExpanderItemTapped?(event: MouseEvent): void
  onCollapserItemTapped?(event: MouseEvent): void
}

let guideManager: YTGuideManager | null = null
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

const updateGuideSubscriptionsSectionRenderer = (data: YTValueData<YTRenderer.Mapped<'guideSubscriptionsSectionRenderer'>>): void => {
  const { items, sort } = data

  if (items == null || sort !== 'CHANNEL_ACTIVITY') return

  const header = items.shift()?.guideCollapsibleSectionEntryRenderer, footer = items.pop()?.guideCollapsibleEntryRenderer
  if (header == null || footer?.expandableItems == null) return

  const visibleItemCount = items.length
  items.push(...footer.expandableItems)

  let pinnedItemCount = 0
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.guideEntryRenderer?.badges?.liveBroadcasting) continue

    items.splice(pinnedItemCount++, 0, ...items.splice(i, 1))
  }

  footer.expandableItems = items.splice(visibleItemCount)
  items.unshift({ guideCollapsibleSectionEntryRenderer: header })
  items.push({ guideCollapsibleEntryRenderer: footer })
}

const updateGuideResponse = (data: YTValueData<YTResponse.Mapped<'guide'>>): void => {
  delete data.responseContext?.maxAgeSeconds

  if (!isYTLoggedIn()) return

  const base = (REFRESH_INTERVAL_SEC - (floor(Date.now() / 1e3) % REFRESH_INTERVAL_SEC))
  const delay = min(...REFRESH_OFFSETS.map(offset => base + offset).filter(delay => delay >= REFRESH_COOLDOWN_SEC))

  if (refreshTimer != null) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(reloadYTGuide, delay * 1e3)
}

const reloadYTGuide = async (): Promise<void> => {
  if (guideManager == null) return

  if (refreshTimer != null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  delete guideManager.guidePromise
  await guideManager.initializeGuideData()

  for (const guide of guideManager.guideRenderers) {
    guideManager.setGuideDataAfterInit(guide)

    const collapsibleEntry = guide.querySelector<YTDGuideCollapsibleEntryRenderer>('ytd-guide-collapsible-entry-renderer')
    if (collapsibleEntry == null) continue

    collapsibleEntry[collapsibleEntry.expanded ? 'onExpanderItemTapped' : 'onCollapserItemTapped']?.(new MouseEvent('click'))
  }
}

export default class YTFeedGuideModule extends Feature {
  public constructor() {
    super('guide')
  }

  protected activate(): boolean {
    YTPolymerCreateCallback.registerCallback(instance => {
      if (!('initializeGuideData' in instance)) return

      guideManager = instance as YTGuideManager
    })

    registerYTValueFilter(YTRenderer.mapped.guideEntryRenderer, filterGuideEntry)
    registerYTValueFilter(YTRenderer.mapped.guideSigninPromoRenderer)
    registerYTValueProcessor(YTRenderer.mapped.guideSubscriptionsSectionRenderer, updateGuideSubscriptionsSectionRenderer)
    registerYTValueProcessor(YTResponse.mapped.guide, updateGuideResponse)

    registerYTSignalActionHandler(YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE, reloadYTGuide)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}