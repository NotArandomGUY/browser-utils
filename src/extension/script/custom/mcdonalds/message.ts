import EventEmitter from '@ext/lib/event-emitter'
import Logger from '@ext/lib/logger'

const logger = new Logger('MCD Message')

export const enum McdMessageEvent {
  ERROR = 'error',
  DATA = 'data',
  DONE = 'done',
  SEND = '_send'
}

export type McdMessageData = {
  id: string
  name: string
  data: unknown | null
} | {
  id: string
  name: string
  cancel: true
} | {
  id: string
  name: string
  done: true
} | {
  id: string
  name: string
  error: Error
}

let nextId = 0

function getNextId(): string {
  return `${++nextId}.${Date.now()}`
}

export default class McdMessage extends EventEmitter {
  public readonly id: string
  public readonly name: string

  private hasSent: boolean
  private isCancelled: boolean
  private isDone: boolean

  public constructor(name: string) {
    super()

    this.id = getNextId()
    this.name = name

    this.hasSent = false
    this.isCancelled = false
    this.isDone = false
  }

  public send(data: unknown | null = null): void {
    const { id, name, hasSent } = this

    if (hasSent) throw new Error('Data already sent')
    this.hasSent = true

    logger.debug('send message:', name, data)

    this.emit(McdMessageEvent.SEND, <McdMessageData>{
      id,
      name,
      data
    })
  }

  public cancel(): void {
    const { id, name, isCancelled, isDone } = this

    if (isCancelled || isDone) return

    logger.debug('cancel message:', name)

    this.isCancelled = true

    this.emit(McdMessageEvent.SEND, <McdMessageData>{
      id,
      name,
      cancel: true
    })
  }

  public handleIncomingMessage(message: McdMessageData): boolean {
    if (message.id !== this.id) return false
    if ('data' in message) this.emit(McdMessageEvent.DATA, message.data)
    if ('error' in message) this.emit(McdMessageEvent.ERROR, message.error)
    if ('done' in message && message.done && !this.isDone) this.emit(McdMessageEvent.DONE)
    return true
  }
}
