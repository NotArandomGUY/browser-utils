import { Feature } from '@ext/lib/feature'
import { registerYTRendererPreProcessor, removeYTRendererPre, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

interface YTGlobal {
  ytUtilActivityCallback_: () => void
}

function generateActivity(): void {
  if (Math.random() > 0.15) return

  const ytglobal = window.ytglobal as YTGlobal
  if (ytglobal == null) return

  const now = Date.now()
  window._lact = now
  if (window._fact == null || window._fact == -1) window._fact = now

  ytglobal.ytUtilActivityCallback_?.()
}

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
    removeYTRendererPre(YTRendererSchemaMap['youThereRenderer'])

    setInterval(generateActivity, 15e3)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}