import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

export default class YTMiscsMerchModule extends Feature {
  public constructor() {
    super('merch')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.merchandiseShelfRenderer)
    registerYTValueFilter(YTRenderer.mapped.productListHeaderRenderer)
    registerYTValueFilter(YTRenderer.mapped.productListItemRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}