import { McdMessageData } from '@ext/custom/mcdonalds/message'
import McdPluginManager from '@ext/custom/mcdonalds/plugin-manager'

export default abstract class McdPluginBase<TMsg = unknown> {
  private readonly manager: McdPluginManager
  private readonly name: string

  public constructor(manager: McdPluginManager, name: string) {
    this.manager = manager
    this.name = name
  }

  public handleIncomingMessage(message: McdMessageData): boolean {
    if (message.name !== this.name) return false
    if ('data' in message) this.onMessage(message.id, <TMsg>message.data)
    if ('cancel' in message) this.onCancel(message.id)
    return true
  }

  protected abstract onMessage(id: string, message: TMsg): void

  protected abstract onCancel(id: string): void

  protected log(...args: unknown[]): void {
    console.log(this.prefix, ...args)
  }


  protected debug(...args: unknown[]): void {
    console.debug(this.prefix, ...args)
  }

  protected data(id: string, data: unknown = null): void {
    this.manager.message({
      id,
      name: this.name,
      data
    })
  }

  protected error(id: string, error: Error): void {
    this.manager.message({
      id,
      name: this.name,
      error
    })
  }

  protected done(id: string): void {
    this.manager.message({
      id,
      name: this.name,
      done: true
    })
  }

  private get prefix(): string {
    return `[MCD Plugin:${this.name}]`
  }
}
