import Logger from '@ext/lib/logger'
import { SignedMessage, signMessage, verifyMessage } from '@ext/lib/message/crypto'
import { MessageData, MessageDataUnion } from '@ext/lib/message/type'
import { MESSAGE_KEY } from '@virtual/package'

const logger = new Logger('MESSAGE-CHANNEL')

export default abstract class MessageChannel<M extends object, U extends string | number | symbol> {
  private readonly channel_: BroadcastChannel

  public constructor(name: string) {
    const channel = new BroadcastChannel(name)

    channel.addEventListener('message', this.onMessageInternal_.bind(this))

    this.channel_ = channel
  }

  public send<T extends U>(type: T, data: MessageData<M, T>): void {
    this.channel_.postMessage(signMessage(MESSAGE_KEY, { type, data }))
  }

  protected abstract onMessage(message: MessageDataUnion<M, U>): void

  private onMessageInternal_({ data }: MessageEvent<SignedMessage<MessageDataUnion<M, U>>>): void {
    if (data == null || typeof data !== 'object' || !verifyMessage(MESSAGE_KEY, data)) {
      logger.debug('invalid message:', data)
      return
    }

    this.onMessage(data)
  }
}