import { removeYTRendererPre, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { Feature } from '@ext/lib/feature'

export default class YTMiscsMerchModule extends Feature {
  public constructor() {
    super('merch')
  }

  protected activate(): boolean {
    removeYTRendererPre(YTRendererSchemaMap['merchandiseShelfRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['productListHeaderRenderer'])
    removeYTRendererPre(YTRendererSchemaMap['productListItemRenderer'])

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}