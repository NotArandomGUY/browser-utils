export default class Callback<A extends unknown[], C extends (...args: A) => void = (...args: A) => void> {
  private readonly callbacks_: Set<C>

  public constructor() {
    this.callbacks_ = new Set()
  }

  /*@__MANGLE_PROP__*/public registerCallback(callback: C): () => void {
    this.callbacks_.add(callback)
    return () => this.unregisterCallback(callback)
  }

  /*@__MANGLE_PROP__*/public unregisterCallback(callback: C): void {
    this.callbacks_.delete(callback)
  }

  public invoke(...args: A): void {
    this.callbacks_.forEach(callback => callback(...args))
  }
}