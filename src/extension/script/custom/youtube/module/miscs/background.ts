import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer } from '@ext/custom/youtube/api/schema'
import { random } from '@ext/global/math'
import { defineProperty, entries, getPropertyDescriptor } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'

const DOCUMENT_PROPERTIES_OVERRIDE = {
  hidden: false,
  webkitHidden: false
}

const generateActivity = (): void => {
  if (random() > 0.15) return

  const ytglobal = window.ytglobal
  if (ytglobal == null) return

  const now = Date.now()
  window._lact = now
  if (window._fact == null || window._fact == -1) window._fact = now

  ytglobal.ytUtilActivityCallback_?.()
}

export default class YTMiscsBackgroundModule extends Feature {
  public constructor() {
    super('background')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.youThereRenderer)

    entries(DOCUMENT_PROPERTIES_OVERRIDE).forEach(([name, value]) => {
      const get = getPropertyDescriptor(document, name)?.get
      if (get == null) return

      defineProperty(Document.prototype, name, {
        configurable: true,
        enumerable: true,
        get: new Hook(get).install(ctx => {
          ctx.returnValue = value
          return HookResult.EXECUTION_RETURN
        }).call
      })
    })

    setInterval(generateActivity, 15e3)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}