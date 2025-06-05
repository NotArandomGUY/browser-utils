import { hoYoAnalysisInstance } from './analysis'

export default function initHoyoVueModule(): void {
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
}