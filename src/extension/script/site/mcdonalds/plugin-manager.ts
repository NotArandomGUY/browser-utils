import { McdMessageData } from '@ext/site/mcdonalds/message'
import McdMessageQueue from '@ext/site/mcdonalds/message-queue'
import type McdPluginBase from '@ext/site/mcdonalds/plugins/base'

export default class McdPluginManager {
  private readonly messageQueue: McdMessageQueue
  private readonly plugins: McdPluginBase[]

  public constructor(messageQueue: McdMessageQueue) {
    this.messageQueue = messageQueue
    this.plugins = []
  }

  public flushMessageQueue(): void {
    const { messageQueue, plugins } = this

    const queuedMessages = messageQueue.flushPluginQueue()
    for (const queuedMessage of queuedMessages) {
      for (const plugin of plugins) {
        if (plugin.handleIncomingMessage(queuedMessage)) break
      }
    }
  }

  public message(message: McdMessageData): void {
    this.messageQueue.enqueueToBridge(message)
  }

  public addPlugin(plugin: new (manager: McdPluginManager) => McdPluginBase): void {
    this.plugins.push(new plugin(this))
  }
}
