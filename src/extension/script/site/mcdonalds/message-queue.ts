import { McdMessageData } from '@ext/site/mcdonalds/message'

export default class McdMessageQueue {
  private readonly pluginQueue: McdMessageData[]
  private readonly bridgeQueue: McdMessageData[]

  public constructor() {
    this.pluginQueue = []
    this.bridgeQueue = []
  }

  public enqueueToPlugin(message: McdMessageData): void {
    this.pluginQueue.push(message)
  }

  public enqueueToBridge(message: McdMessageData): void {
    this.bridgeQueue.push(message)
  }

  public flushPluginQueue(): McdMessageData[] {
    return this.pluginQueue.splice(0)
  }

  public flushBridgeQueue(): McdMessageData[] {
    return this.bridgeQueue.splice(0)
  }
}
