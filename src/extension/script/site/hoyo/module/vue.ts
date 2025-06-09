import { Feature } from '@ext/lib/feature'
import { hoYoAnalysisInstance } from './analysis'

export default class HoyoVueModule extends Feature {
  protected activate(): boolean {
    let vue: unknown = undefined

    Object.defineProperty(window, 'Vue', {
      get() {
        return vue
      },
      set(v) {
        Object.defineProperty(v.prototype, '$mia', { configurable: true, get() { return hoYoAnalysisInstance }, set() { } })
        vue = v
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}