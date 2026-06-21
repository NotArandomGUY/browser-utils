import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const filterTimelyActionRenderer = (data: YTValueData<YTRenderer.Mapped<'timelyActionRenderer'>>): boolean => {
  return data.type !== 'TIMELY_ACTION_TYPE_SHOPPING'
}

const filterTransportControlsAction = (data: YTValueData<YTRenderer.Component<'transportControlsAction'>>): boolean => {
  return data.type !== 'TRANSPORT_CONTROLS_BUTTON_TYPE_SHOPPING'
}

export default class YTMiscsMerchModule extends Feature {
  public constructor() {
    super('merch')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueFilter(YTRenderer.components.transportControlsAction, filterTransportControlsAction),
      registerYTValueFilter(YTRenderer.mapped.merchandiseShelfRenderer),
      registerYTValueFilter(YTRenderer.mapped.productListHeaderRenderer),
      registerYTValueFilter(YTRenderer.mapped.productListItemRenderer),
      registerYTValueFilter(YTRenderer.mapped.timelyActionRenderer, filterTimelyActionRenderer)
    )

    return true
  }
}