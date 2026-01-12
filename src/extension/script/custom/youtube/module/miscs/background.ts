import { registerYTValueFilter } from '@ext/custom/youtube/api/processor'
import { YTRenderer } from '@ext/custom/youtube/api/schema'
import { random } from '@ext/global/math'
import { defineProperties } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'

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

    defineProperties(document, {
      hidden: {
        configurable: true,
        get() {
          return false
        }
      },
      webkitHidden: {
        configurable: true,
        get() {
          return false
        }
      }
    })

    setInterval(generateActivity, 15e3)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}