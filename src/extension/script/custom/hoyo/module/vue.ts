import { hoYoAnalysisInstance } from '@ext/custom/hoyo/module/analysis'
import { defineProperty } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'

export default class HoyoVueModule extends Feature {
  protected activate(): boolean {
    let vue: unknown = undefined

    defineProperty(window, 'Vue', {
      get() {
        return vue
      },
      set(v) {
        defineProperty(v.prototype, '$mia', { configurable: true, get() { return hoYoAnalysisInstance }, set() { } })
        vue = v
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}