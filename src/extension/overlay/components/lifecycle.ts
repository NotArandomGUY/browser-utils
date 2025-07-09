import { floor, random } from '@ext/global/math'

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

    element.onCreate(props)

    return element
  }

  protected static getId(name: string): string {
    return `lc-${name}-${getSuffix()}`
  }

  public disconnectedCallback(): void {
    this.onDestroy()
  }

  public connectedMoveCallback(): void {
    return
  }

  protected abstract onCreate(props: P): void

  protected abstract onDestroy(): void
}