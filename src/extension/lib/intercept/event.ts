import { assign, defineProperties } from '@ext/global/object'
import Logger from '@ext/lib/logger'

const logger = new Logger('INTERCEPT-EVENT')

interface InterceptEventTarget<TTarget, TMap> extends EventTarget {
  [EventTargetAdapterSymbol]: InterceptEventTargetAdapter<TTarget, TMap>
}

interface InterceptListenerEntry {
  listener: Function
  options?: AddEventListenerOptions
}

const EventTargetAdapterSymbol = Symbol()
const EventPreventDispatchSymbol = Symbol()

const { addEventListener, dispatchEvent, removeEventListener } = EventTarget.prototype

const getAdapter = <TTarget, TMap>(instance: unknown): InterceptEventTargetAdapter<TTarget, TMap> | null => {
  if (instance instanceof EventTarget) instance = (instance as InterceptEventTarget<TTarget, TMap>)[EventTargetAdapterSymbol]
  if (instance instanceof InterceptEventTargetAdapter) return instance
  return null
}

export const preventDispatchEvent = (event: Event): void => {
  if (EventPreventDispatchSymbol in event && typeof event[EventPreventDispatchSymbol] === 'function') event[EventPreventDispatchSymbol]()
}

export default class InterceptEventTargetAdapter<TTarget, TMap> {
  /// Public ///

  public constructor(eventTarget: EventTarget, forward: boolean) {
    this.target_ = eventTarget as InterceptEventTarget<TTarget, TMap>
    this.forward_ = forward
    this.eventFowarderSet_ = new Set()
    this.eventListenerMap_ = {}
    this.setterListenerMap_ = {}

    assign(eventTarget, {
      [EventTargetAdapterSymbol]: this,
      dispatchEvent: this.dispatchEvent,
      addEventListener: this.addEventListener,
      removeEventListener: this.removeEventListener
    })
  }

  public addEventListener<KM extends keyof TMap>(type: KM, listener: (event: TMap[KM]) => Promise<void> | void, options?: AddEventListenerOptions): void {
    const adapter = getAdapter<TTarget, TMap>(this)
    if (adapter == null) return addEventListener.call(this, type as string, listener as EventListener, options)

    adapter.getListenerList_(type).push({ listener, options })
    adapter.activateEvent_(type)
  }

  public removeEventListener<KM extends keyof TMap>(type: KM, listener: (event: TMap[KM]) => Promise<void> | void): void {
    const adapter = getAdapter<TTarget, TMap>(this)
    if (adapter == null) return removeEventListener.call(this, type as string, listener as EventListener)

    const listenerList = adapter.eventListenerMap_[type]
    if (listenerList == null) return

    const entry = listenerList.find(entry => entry.listener === listener)
    if (entry == null) return

    listenerList.splice(listenerList.indexOf(entry), 1)
    adapter.deactivateEvent_(type)
  }

  public removeAllEventListener<KM extends keyof TMap>(type: KM): void {
    const listenerList = this.eventListenerMap_[type]
    if (listenerList == null) return

    listenerList.splice(0)
    this.deactivateEvent_(type)
  }

  public getEventListener<KT extends keyof TTarget>(prop: KT): TTarget[KT] | null {
    return <TTarget[KT]>this.setterListenerMap_[prop] ?? null
  }

  public setEventListener<KT extends keyof TTarget, KM extends keyof TMap>(prop: KT, type: KM, listener: TTarget[KT] | null): void {
    if (listener == null) {
      this.deleteEventListener(prop, type)
      return
    }

    this.addEventListener(type, <(event: TMap[KM]) => void>listener)
    this.setterListenerMap_[prop] = <Function><unknown>listener
  }

  public deleteEventListener<KT extends keyof TTarget, KM extends keyof TMap>(prop: KT, type: KM): void {
    const listener = this.setterListenerMap_[prop]
    if (listener == null) return

    this.removeEventListener(type, <(event: TMap[KM]) => void>listener)
    delete this.setterListenerMap_[prop]
  }

  public dispatchEvent(event: Event): boolean {
    const adapter = getAdapter(this)
    if (adapter == null) return dispatchEvent.call(this, event)

    adapter.dispatchAdapterEvent_(event)
    return !event.defaultPrevented
  }

  /// Private ///

  private readonly target_: InterceptEventTarget<TTarget, TMap>
  private readonly forward_: boolean
  private readonly eventFowarderSet_: Set<keyof TMap>
  private readonly eventListenerMap_: { [type in keyof TMap]?: InterceptListenerEntry[] }
  private readonly setterListenerMap_: { [prop in keyof TTarget]?: Function }

  private getListenerList_<KM extends keyof TMap>(type: KM): InterceptListenerEntry[] {
    const { eventListenerMap_ } = this

    let listenerList = eventListenerMap_[type]
    if (listenerList == null) {
      listenerList = []
      eventListenerMap_[type] = listenerList
    }

    return listenerList
  }

  private activateEvent_<KM extends keyof TMap>(type: KM): void {
    const { target_, forward_, eventFowarderSet_, dispatchEvent } = this

    if (forward_ && !eventFowarderSet_.has(type)) {
      addEventListener.call(target_, type as string, dispatchEvent)
      eventFowarderSet_.add(type)
    }
  }

  private deactivateEvent_<KM extends keyof TMap>(type: KM): void {
    const { target_, eventFowarderSet_, eventListenerMap_, dispatchEvent } = this

    if (eventFowarderSet_.delete(type)) removeEventListener.call(target_, type as string, dispatchEvent)
    if (eventListenerMap_[type]?.length === 0) delete eventListenerMap_[type]
  }

  private async dispatchAdapterEvent_(event: Event): Promise<void> {
    const { target_, eventListenerMap_ } = this
    const { type } = event

    const listenerList = eventListenerMap_[type as keyof TMap]
    if (listenerList == null) return

    let isPreventDispatch = false

    defineProperties(event, {
      target: { configurable: true, writable: false, value: target_ },
      [EventPreventDispatchSymbol]: { configurable: true, enumerable: false, value() { isPreventDispatch = true } }
    })

    for (const { listener, options } of listenerList) {
      logger.trace('dispatch event:', type, listener, options)

      const once = options?.once
      const aborted = options?.signal?.aborted

      if (!aborted) {
        try {
          await listener.call(target_, event)
        } catch (error) {
          logger.error('event listener error:', error)
        }
      }

      if (once || aborted) this.removeEventListener(type as keyof TMap, <(event: TMap[keyof TMap]) => void>listener)
      if (isPreventDispatch) break
    }

    delete event[EventPreventDispatchSymbol as unknown as keyof typeof event]
  }
}