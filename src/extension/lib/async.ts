type WaitCondition<TArgs extends [] = []> = (...args: TArgs) => boolean

const taskList: [cond: WaitCondition | number, resolve: () => void, time: number][] = []

setInterval(() => {
  let i = 0
  while (i < taskList.length) {
    try {
      const [cond, resolve, time] = taskList[i++]

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

export class PromiseWithProgress<TResolve, TProgress, TReject = unknown> extends Promise<TResolve> {
  private readonly progressCallbacks_: PromiseProgress<TProgress>[]
  private resolved_: boolean

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
          this.resolved_ = true
        },
        async (...args) => {
          if (!isInitialized) await waitUntil(() => isInitialized)
          reject(...args)
          this.resolved_ = true
        },
        async (progress) => {
          if (!isInitialized) await waitUntil(() => isInitialized)

          try {
            if (this.resolved_) return

            this.progressCallbacks_.forEach((callback) => callback(progress))
          } catch (error) {
            reject(error)
          }
        },
      )
    )

    this.progressCallbacks_ = []
    this.resolved_ = false

    isInitialized = true
  }

  public progress(callback: PromiseProgress<TProgress>): this {
    this.progressCallbacks_.push(callback)

    return this
  }
}

export class Mutex {
  private promise_: Promise<void> | null = null
  private resolve_: (() => void) | null = null

  public get isLocked(): boolean {
    return this.promise_ != null
  }

  public async lock(): Promise<void> {
    while (this.promise_ != null) await this.promise_
    this.promise_ = new Promise((resolve) => this.resolve_ = resolve)
  }

  public unlock(): void {
    this.resolve_?.()

    this.promise_ = null
    this.resolve_ = null
  }
}

export const waitTick = (): Promise<void> => {
  return new Promise((resolve) => taskList.push([20, resolve, Date.now()]))
}

export const waitMs = (ms: number): Promise<void> => {
  return new Promise((resolve) => taskList.push([ms, resolve, Date.now()]))
}

export const waitUntil = (cond: WaitCondition): Promise<void> => {
  return new Promise((resolve) => taskList.push([cond, resolve, 0]))
}

export function waitAllBatched<T>(tasks: Iterable<() => PromiseLike<T>>, ...batchSizes: number[]): PromiseWithProgress<T[], number>
export function waitAllBatched<T extends readonly (() => PromiseLike<unknown>)[] = []>(tasks: T, ...batchSizes: number[]): PromiseWithProgress<{ [P in keyof T]: Awaited<ReturnType<T[P]>> }, number>
export function waitAllBatched(tasks: Iterable<() => PromiseLike<unknown>>, ...batchSizes: number[]): PromiseWithProgress<unknown[], number> {
  return new PromiseWithProgress(async (resolve, reject, progress) => {
    try {
      const taskArr = Array.from(tasks)
      const results: unknown[] = []

      for (let i = 0, s = 1; i < taskArr.length; i += s, s = batchSizes.shift() ?? s) {
        const batchResults = await Promise.allSettled(taskArr.slice(i, i + s).map(task => task()))

        const rejected = batchResults.find(r => r.status !== 'fulfilled')
        if (rejected != null) throw rejected.reason

        results.push(...(batchResults as PromiseFulfilledResult<unknown>[]).map(r => r.value))
        progress(results.length)
      }

      resolve(results)
    } catch (error) {
      reject(error)
    }
  })
}