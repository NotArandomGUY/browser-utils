import { floor, random } from '@ext/global/math'
import { defineProperty } from '@ext/global/object'
import { unsafePolicy } from '@ext/lib/dom'

const PropsSymbol = Symbol()

const getSuffix = (): string => {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += floor(random() * 0x100).toString(16).padStart(2, '0')
  }
  return suffix
}

export default abstract class Lifecycle<P> extends HTMLElement {
  public static define(type: new () => Lifecycle<unknown>, id: string): void {
    customElements.define(id, type)
  }

  public static create(props: unknown, id: string): HTMLElement {
    const element = document.createElement(id) as Lifecycle<unknown>

    defineProperty(element, PropsSymbol, { configurable: false, enumerable: false, writable: false, value: props })

    return element
  }

  protected static getId(name: string): string {
    return `lc-${name}-${getSuffix()}`
  }

  public connectedCallback(): void {
    this.onCreate((this as Record<typeof PropsSymbol, P>)[PropsSymbol])
  }

  public disconnectedCallback(): void {
    this.onDestroy()

    this.innerHTML = unsafePolicy.createHTML('')
    Array.from(this.attributes).forEach(attr => this.removeAttribute(attr.name))
  }

  public connectedMoveCallback(): void {
    return
  }

  protected abstract onCreate(props: P): void

  protected abstract onDestroy(): void
}