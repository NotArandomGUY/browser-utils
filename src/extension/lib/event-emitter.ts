const prefix = '~'

type Events = { [name: string]: EE | EE[] }

class EE {
  public fn: Function
  public context: unknown
  public once: boolean

  public constructor(fn: Function, context: unknown, once = false) {
    this.fn = fn
    this.context = context
    this.once = once
  }
}

export default class EventEmitter {
  private events: Events
  private eventsCount: number

  public constructor() {
    this.events = {}
    this.eventsCount = 0
  }

  /**
   * Add a listener for a given event.
   *
   * @param {String} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  public on(event: string, fn: Function, context?: unknown): EventEmitter {
    return this.addListener(event, fn, context, false)
  }

  /**
  * Add a one-time listener for a given event.
  *
  * @param {String} event The event name.
  * @param {Function} fn The listener function.
  * @param {*} [context=this] The context to invoke the listener with.
  * @returns {EventEmitter} `this`.
  * @public
  */
  public once(event: string, fn: Function, context?: unknown): EventEmitter {
    return this.addListener(event, fn, context, true)
  }

  /**
   * Add a listener for a given event.
   *
   * @param {String} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
   * @returns {EventEmitter}
   * @public
   */
  public addListener(event: string, fn: Function, context?: unknown, once: boolean = false): EventEmitter {
    if (typeof fn !== 'function') throw new TypeError('The listener must be a function');

    const listener = new EE(fn, context || this, once)
    const evt = prefix ? prefix + event : event;

    const listeners = this.events[evt]
    if (!listeners) this.events[evt] = listener, this.eventsCount++;
    else if (Array.isArray(listeners)) listeners.push(listener);
    else this.events[evt] = [listeners, listener];

    return this;
  }

  /**
  * Remove the listeners of a given event.
  *
  * @param {String} event The event name.
  * @param {Function} fn Only remove the listeners that match this function.
  * @param {*} context Only remove the listeners that have this context.
  * @param {Boolean} once Only remove one-time listeners.
  * @returns {EventEmitter} `this`.
  * @public
  */
  public removeListener(event: string, fn: Function, context?: unknown, once: boolean = false): EventEmitter {
    const evt = prefix ? prefix + event : event;

    if (!this.events[evt]) return this;
    if (!fn) {
      this.clearEvent(evt);
      return this;
    }

    const listeners = this.events[evt];

    if (Array.isArray(listeners)) {
      const events: EE[] = []

      for (const listener of listeners) {
        if (listener.fn === fn && (!once || listener.once) && (!context || listener.context === context)) continue

        events.push(listener);
      }

      //
      // Reset the array, or remove it completely if we have no more listeners.
      //
      if (events.length > 0) {
        this.events[evt] = events.length === 1 ? events[0] : events;
      } else {
        this.clearEvent(evt);
      }
    } else {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        this.clearEvent(evt);
      }
    }

    return this;
  }

  /**
  * Calls each of the listeners registered for a given event.
  *
  * @param {String} event The event name.
  * @returns {Boolean} `true` if the event had listeners, else `false`.
  * @public
  */
  public emit(event: string, ...args: unknown[]): boolean {
    const evt = prefix ? prefix + event : event

    const listeners = this.events[evt]
    if (!listeners) return false

    if (Array.isArray(listeners)) {
      for (const listener of listeners) {
        if (listener.once) this.removeListener(event, listener.fn, undefined, true)

        listener.fn.apply(listener.context, args)
      }
    } else {
      if (listeners.once) this.removeListener(event, listeners.fn, undefined, true)

      listeners.fn.apply(listeners.context, args)
    }

    return true
  }

  /**
  * Clear event by name.
  *
  * @param {String} evt The Event name.
  * @private
  */
  private clearEvent(evt: string): void {
    if (--this.eventsCount === 0) this.events = {};
    else delete this.events[evt];
  }
}
