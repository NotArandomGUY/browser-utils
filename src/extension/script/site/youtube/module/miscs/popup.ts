import { Feature } from '@ext/lib/feature'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

function updateNextResponse(data: YTRendererData<YTRenderer<'nextResponse'>>): boolean {
  delete data.survey

  return true
}

export default class YTMiscsPopupModule extends Feature {
  public constructor() {
    super('miscs-popup')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['nextResponse'], updateNextResponse)

    removeYTRendererPre(YTRendererSchemaMap['mealbarPromoRenderer'])

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}