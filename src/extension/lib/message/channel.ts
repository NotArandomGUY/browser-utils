import { floor, random } from '@ext/global/math'
import Logger from '@ext/lib/logger'
import { SignedMessage, signMessage, verifyMessage } from '@ext/lib/message/crypto'
import { MessageData, MessageDataUnion } from '@ext/lib/message/type'
import { MESSAGE_KEY } from '@virtual/package'

const logger = new Logger('MESSAGE-CHANNEL')

export type ChannelMessageData<M extends object, U extends string | number | symbol> = SignedMessage<MessageDataUnion<M, U>> & {
  source: number
  target: number | null
}

const kiChannel = Symbol()

export default abstract class MessageChannel<M extends object, U extends string | number | symbol> {
  public readonly source: number
  public boundTo: number | null = null

  private readonly [kiChannel]: BroadcastChannel

  public constructor(name: string, persist: boolean, index = 0) {
    let source = persist ? Number(sessionStorage.getItem(name)) : NaN
    if (!source) {
      source = (((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0
      if (persist) sessionStorage.setItem(name, String(source))
    }
    this.source = ((source & ~0x7F) | (index & 0x7F)) >>> 0

    const channel = new BroadcastChannel(name)
    channel.addEventListener('message', this.onMessageInternal_.bind(this))
    this[kiChannel] = channel
  }

  public bind(target: number | null): boolean {
    if (this.boundTo === target) return false

    this.boundTo = target
    return true
  }

  public broadcast<T extends U>(type: T, data: MessageData<M, T>): void {
    const { source, [kiChannel]: channel } = this

    channel.postMessage(signMessage(MESSAGE_KEY, { type, data, source, target: null }) satisfies ChannelMessageData<M, U>)
  }

  public send<T extends U>(type: T, data: MessageData<M, T>, target?: number | null): boolean {
    const { source, boundTo, [kiChannel]: channel } = this

    target ??= boundTo
    if (target == null) return false

    channel.postMessage(signMessage(MESSAGE_KEY, { type, data, source, target }) satisfies ChannelMessageData<M, U>)
    return true
  }

  protected abstract onBroadcast(message: ChannelMessageData<M, U>): void

  protected abstract onMessage(message: ChannelMessageData<M, U>): void

  private onMessageInternal_({ data }: MessageEvent<ChannelMessageData<M, U>>): void {
    if (data == null || typeof data !== 'object' || !verifyMessage(MESSAGE_KEY, data)) {
      logger.debug('invalid message:', data)
      return
    }

    const { source, boundTo } = this

    switch (data.target) {
      case source:
        if (boundTo == null || data.source === boundTo) this.onMessage(data)
        return
      case null:
        this.onBroadcast(data)
        return
      default:
        logger.debug('invalid target for message:', data)
        return
    }
  }
}