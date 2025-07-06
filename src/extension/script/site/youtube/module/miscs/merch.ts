import { Feature } from '@ext/lib/feature'
import { removeYTRendererPre, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

export default class YTMiscsMerchModule extends Feature {
  public constructor() {
    super('miscs-merch')
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