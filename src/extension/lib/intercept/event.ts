import Logger from '@ext/lib/logger'

interface InterceptListenerEntry {
  listener: Function
  options?: AddEventListenerOptions
}

const logger = new Logger('INTERCEPT-EVENT')

export default class InterceptEventTargetAdapter<TTarget, TMap> {
  /// Public ///

  public constructor(eventTarget: EventTarget) {
    this.eventHandlerMap = {}
    this.eventListenerMap = {}
    this.setterListenerMap = {}
    this.blockedEventMap = {}

    this.internalAddEventListener = eventTarget.addEventListener.bind(eventTarget)
    this.internalRemoveEventListener = eventTarget.removeEventListener.bind(eventTarget)

    eventTarget.addEventListener = <EventTarget['addEventListener']>this.addEventListener.bind(this)
    eventTarget.removeEventListener = <EventTarget['removeEventListener']>this.removeEventListener.bind(this)
  }

  public addEventListener<KM extends keyof TMap>(type: KM, listener: (evt: TMap[KM]) => void, options?: AddEventListenerOptions): void {
    this.getListenerList(type).push({ listener, options })
    this.activateEvent(type)
  }

  public removeEventListener<KM extends keyof TMap>(type: KM, listener: (evt: TMap[KM]) => void): void {
    const listenerList = this.eventListenerMap[type]
    if (listenerList == null) return

    const entry = listenerList.find(l => l.listener === listener)
    if (entry == null) return

    listenerList.splice(listenerList.indexOf(entry), 1)
    this.deactivateEvent(type)
  }

  public removeAllEventListener<KM extends keyof TMap>(type: KM): void {
    const listenerList = this.eventListenerMap[type]
    if (listenerList == null) return

    listenerList.splice(0)
    this.deactivateEvent(type)
  }

  public getEventListener<KT extends keyof TTarget>(prop: KT): TTarget[KT] | null {
    return <TTarget[KT]>this.setterListenerMap[prop] ?? null
  }

  public setEventListener<KT extends keyof TTarget, KM extends keyof TMap>(prop: KT, type: KM, listener: TTarget[KT] | null): void {
    if (listener == null) {
      this.deleteEventListener(prop, type)
      return
    }

    this.addEventListener(type, <(evt: TMap[KM]) => void>listener)
    this.setterListenerMap[prop] = <Function><unknown>listener
  }

  public deleteEventListener<KT extends keyof TTarget, KM extends keyof TMap>(prop: KT, type: KM): void {
    const listener = this.setterListenerMap[prop]
    if (listener == null) return

    this.removeEventListener(type, <(evt: TMap[KM]) => void>listener)
    delete this.setterListenerMap[prop]
  }

  public blockEvent<KM extends keyof TMap>(type: KM): void {
    this.blockedEventMap[type] = true
  }

  public unblockEvent<KM extends keyof TMap>(type: KM): void {
    delete this.blockedEventMap[type]
  }

  public dispatchEvent<KM extends keyof TMap>(type: KM, evt: Event): void {
    const listenerList = this.eventListenerMap[type]
    if (listenerList == null) return

    logger.debug('intercepted event:', type, listenerList)

    const isBlocked = this.blockedEventMap[type] === true
    if (isBlocked) return

    for (const { listener, options } of listenerList) {
      const once = options?.once
      const aborted = options?.signal?.aborted

      if (!aborted) {
        try {
          listener(evt)
        } catch (error) {
          logger.error(error)
        }
      }

      if (once || aborted) this.removeEventListener(type, <(evt: TMap[KM]) => void>listener)
      if (evt.defaultPrevented) break
    }
  }

  /// Private ///

  private eventHandlerMap: { [type in keyof TMap]?: (evt: Event) => void }
  private eventListenerMap: { [type in keyof TMap]?: InterceptListenerEntry[] }
  private setterListenerMap: { [prop in keyof TTarget]?: Function }
  private blockedEventMap: { [type in keyof TMap]?: boolean }
  private readonly internalAddEventListener: (type: string, listener: EventListener) => void
  private readonly internalRemoveEventListener: (type: string, listener: EventListener) => void

  private getListenerList<KM extends keyof TMap>(type: KM): InterceptListenerEntry[] {
    let listenerList = this.eventListenerMap[type]
    if (listenerList == null) {
      listenerList = []
      this.eventListenerMap[type] = listenerList
    }

    return listenerList
  }

  private activateEvent<KM extends keyof TMap>(type: KM): void {
    if (this.eventHandlerMap[type] != null || this.eventListenerMap[type] == null) return

    const handler = this.dispatchEvent.bind(this, type)

    this.internalAddEventListener(<string>type, handler)
    this.eventHandlerMap[type] = handler
  }

  private deactivateEvent<KM extends keyof TMap>(type: KM): void {
    const handler = this.eventHandlerMap[type]
    if (handler == null || this.eventListenerMap[type]?.length !== 0) return

    this.internalRemoveEventListener(<string>type, handler)
    delete this.eventListenerMap[type]
  }
}