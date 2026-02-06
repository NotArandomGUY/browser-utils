import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

export default class YTMiscsMerchModule extends Feature {
  public constructor() {
    super('merch')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueFilter(YTRenderer.mapped.merchandiseShelfRenderer),
      registerYTValueFilter(YTRenderer.mapped.productListHeaderRenderer),
      registerYTValueFilter(YTRenderer.mapped.productListItemRenderer)
    )

    return true
  }
}