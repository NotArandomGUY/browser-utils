export type CallbackFunction<A extends unknown[]> = (...args: A) => Promise<void> | void

export default class Callback<A extends unknown[]> {
  private readonly callbacks_: Set<CallbackFunction<A>>

  public constructor() {
    this.callbacks_ = new Set()
  }

  /*@__MANGLE_PROP__*/public registerCallback(callback: CallbackFunction<A>): () => void {
    this.callbacks_.add(callback)
    return () => this.unregisterCallback(callback)
  }

  /*@__MANGLE_PROP__*/public unregisterCallback(callback: CallbackFunction<A>): void {
    this.callbacks_.delete(callback)
  }

  public invoke(...args: A): void {
    this.callbacks_.forEach(callback => callback(...args))
  }

  public async invokeAsync(...args: A): Promise<void> {
    await Promise.all(Array.from(this.callbacks_).map(callback => Promise.resolve(callback(...args))))
  }
}