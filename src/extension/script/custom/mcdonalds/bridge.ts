import McdMessage, { McdMessageEvent } from '@ext/custom/mcdonalds/message'
import McdMessageQueue from '@ext/custom/mcdonalds/message-queue'

type McdBridgeCallback = (error: Error | null, data?: unknown) => void

export default class McdBridge {
  private readonly messageQueue: McdMessageQueue
  private readonly messages: McdMessage[]

  public constructor(messageQueue: McdMessageQueue) {
    this.messageQueue = messageQueue
    this.messages = []
  }

  public flushMessageQueue(): void {
    const { messageQueue, messages } = this

    const queuedMessages = messageQueue.flushBridgeQueue()
    for (const queuedMessage of queuedMessages) {
      for (const message of messages) {
        if (message.handleIncomingMessage(queuedMessage)) break
      }
    }
  }

  public message(name: string): McdMessage
  public message(name: string, data: unknown): McdMessage
  public message(name: string, callback: McdBridgeCallback): McdMessage
  public message(name: string, data: unknown, callback: McdBridgeCallback): McdMessage
  public message(name: string, dataOrCallback?: unknown | McdBridgeCallback, callback?: McdBridgeCallback): McdMessage {
    const { messageQueue, messages } = this

    if (typeof dataOrCallback === 'function') {
      callback = <McdBridgeCallback>dataOrCallback
      dataOrCallback = undefined
    }

    const message = new McdMessage(name)

    message.on(McdMessageEvent.SEND, messageQueue.enqueueToPlugin, messageQueue)
    message.once(McdMessageEvent.DONE, () => {
      const index = messages.indexOf(message)
      if (index >= 0) messages.splice(index, 1)
    })

    if (callback) {
      message.once(McdMessageEvent.ERROR, (error: Error) => callback(error))
      message.once(McdMessageEvent.DATA, (data: unknown) => callback(null, data))
    }

    if (typeof dataOrCallback !== 'undefined' || callback) message.send(dataOrCallback ?? null)

    messages.push(message)

    return message
  }
}
