type WaitCondition<TArgs extends [] = []> = (...args: TArgs) => boolean

const taskList: {
  cond: WaitCondition | number
  resolve: () => void
  time: number
}[] = []

setInterval(() => {
  let i = 0
  while (i < taskList.length) {
    try {
      const { cond, resolve, time } = taskList[i++]

      if (typeof cond === 'number' && Date.now() - time < cond) continue
      if (typeof cond === 'function' && !cond()) continue

      // Remove and resolve task
      taskList.splice(--i, 1)
      resolve()
    } catch (err) {
      console.log(err)
    }
  }
}, 20)

export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void
export type PromiseReject<T> = (reason?: T) => void
export type PromiseProgress<T> = (progress: T) => void

export class PromiseWithProgress<TResolve = void, TReject = void, TProgress = void> extends Promise<TResolve> {
  private readonly progressCallbacks: PromiseProgress<TProgress>[]
  private resolved: boolean

  public constructor(
    executor: (
      resolve: PromiseResolve<TResolve>,
      reject: PromiseReject<TReject>,
      progress: PromiseProgress<TProgress>,
    ) => void,
  ) {
    let isInitialized = false

    super((resolve, reject) =>
      executor(
        async (...args) => {
          if (!isInitialized) await waitUntil(() => isInitialized)
          resolve(...args)
          this.resolved = true
        },
        async (...args) => {
          if (!isInitialized) await waitUntil(() => isInitialized)
          reject(...args)
          this.resolved = true
        },
        async (progress) => {
          if (!isInitialized) await waitUntil(() => isInitialized)

          try {
            if (this.resolved) return

            this.progressCallbacks.forEach((callback) => callback(progress))
          } catch (error) {
            reject(error)
          }
        },
      )
    )

    this.progressCallbacks = []
    this.resolved = false

    isInitialized = true
  }

  public progress(callback: PromiseProgress<TProgress>): this {
    this.progressCallbacks.push(callback)

    return this
  }
}

export class Mutex {
  private promise: Promise<void> | null
  private resolve: (() => void) | null

  public constructor() {
    this.promise = null
    this.resolve = null
  }

  public get isLocked(): boolean {
    return this.promise != null
  }

  public async lock(): Promise<void> {
    while (this.promise != null) await this.promise
    this.promise = new Promise((resolve) => this.resolve = resolve)
  }

  public unlock(): void {
    this.resolve?.()

    this.promise = null
    this.resolve = null
  }
}

export const waitTick = (): Promise<void> => {
  return new Promise((resolve) => taskList.push({ cond: 20, resolve, time: Date.now() }))
}

export const waitMs = (ms: number): Promise<void> => {
  return new Promise((resolve) => taskList.push({ cond: ms, resolve, time: Date.now() }))
}

export const waitUntil = (cond: WaitCondition): Promise<void> => {
  return new Promise((resolve) => taskList.push({ cond, resolve, time: 0 }))
}