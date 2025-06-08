import Logger from '@ext/lib/logger'

const logger = new Logger('DOM')

const elementMap: { [selectors: string]: Element } = {}
const monitorSelectorList: [string, (element: Element) => void][] = []

let timer: number | null = null

function update(): void {
  if (monitorSelectorList.length === 0) {
    if (timer != null) {
      window.clearInterval(timer)
      timer = null
    }
    return
  }

  for (const [selectors, callback] of monitorSelectorList) {
    const newElement = querySelectorOnce(selectors)
    if (newElement == null) continue

    callback(newElement)
  }
}

function ensureTimer(): void {
  if (timer != null) return
  timer = window.setInterval(update, 500)
}

export function querySelectorOnce<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null
export function querySelectorOnce<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null
export function querySelectorOnce<K extends keyof MathMLElementTagNameMap>(selectors: K): MathMLElementTagNameMap[K] | null
export function querySelectorOnce<E extends Element = Element>(selectors: string): E | null
export function querySelectorOnce(selectors: string): Element | null {
  const curr = document.querySelector(selectors)
  if (curr == null) return null

  const prev = elementMap[selectors]
  if (curr === prev) return null

  elementMap[selectors] = curr
  return curr
}

export function monitorSelector<K extends keyof HTMLElementTagNameMap>(selectors: K, callback: (element: HTMLElementTagNameMap[K]) => void): () => void
export function monitorSelector<K extends keyof SVGElementTagNameMap>(selectors: K, callback: (element: SVGElementTagNameMap[K]) => void): () => void
export function monitorSelector<K extends keyof MathMLElementTagNameMap>(selectors: K, callback: (element: MathMLElementTagNameMap[K]) => void): () => void
export function monitorSelector<E extends Element = Element>(selectors: string, callback: (element: E) => void): () => void
export function monitorSelector(selectors: string, callback: (element: Element) => void): () => void {
  const entry: typeof monitorSelectorList[number] = [selectors, callback]
  monitorSelectorList.push(entry)
  ensureTimer()
  return () => monitorSelectorList.splice(monitorSelectorList.indexOf(entry), 1)
}

export function getNextData<T>(prop: string, defaultValue: T): T {
  const script = document.querySelector<HTMLScriptElement>('#__NEXT_DATA__')
  if (script == null) return defaultValue

  try {
    const data = JSON.parse(script.textContent ?? '{}')
    const keys = prop.split('.')

    for (let i = 0, o = data; i < keys.length; i++) {
      const key = keys[i]

      if (o[key] == null) o[key] = {}
      if (typeof o[key] !== 'object') throw new Error(`'${keys.slice(0, i + 1).join('.')}' is not an object`)

      if (i < keys.length - 1) {
        o = o[key]
        continue
      }

      return o[key]
    }
  } catch (error) {
    logger.warn('failed to get next data, error:', error)
  }

  return defaultValue
}

export function setNextData<T>(prop: string, value: T): void {
  const script = document.querySelector<HTMLScriptElement>('#__NEXT_DATA__')
  if (script == null) return

  try {
    const data = JSON.parse(script.textContent ?? '{}')
    const keys = prop.split('.')

    for (let i = 0, o = data; i < keys.length; i++) {
      const key = keys[i]

      if (o[key] == null) o[key] = {}
      if (typeof o[key] !== 'object') throw new Error(`'${keys.slice(0, i + 1).join('.')}' is not an object`)

      if (i < keys.length - 1) {
        o = o[key]
        continue
      }

      o[key] = value
    }

    script.textContent = JSON.stringify(data)
  } catch (error) {
    logger.warn('failed to set next data, error:', error)
  }
}