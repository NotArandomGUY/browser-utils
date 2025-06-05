import Hook, { HookResult, HookType } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

export type FetchInput = string | URL | Request

export const enum FetchState {
  UNSENT,
  SUCCESS,
  FAILED
}

export interface FetchContextBase<U = unknown> {
  url: URL
  input: FetchInput
  init: RequestInit
  userData: U | null
}
export type FetchContextState = { state: FetchState.UNSENT } | { state: FetchState.SUCCESS, response: Response } | { state: FetchState.FAILED, error: Error }
export type FetchContext<U = unknown> = FetchContextBase<U> & FetchContextState

interface LocalFetchState<U = unknown> {
  promise: Promise<void>
  callback: FetchCallback<U>
}

interface GlobalFetchState<U = unknown> {
  fetchCtx: FetchContext<U>
  localStates: LocalFetchState<U>[]
}

export type FetchCallback<U = unknown> = (ctx: FetchContext<U>) => Promise<void> | void

const logger = new Logger('INTERCEPT-FETCH')

export default class InterceptFetch {
  /// Public ///

  public static setCallback<U = unknown>(callback: FetchCallback<U>): void {
    let hook = InterceptFetch.hook
    if (hook == null) {
      hook = new Hook(window.fetch)
      InterceptFetch.hook = hook
      window.fetch = hook.call

      hook.install(ctx => {
        const [input, init] = ctx.args

        const globalState: GlobalFetchState = {
          fetchCtx: {
            url: new URL(input instanceof Request ? input.url : input, location.href),
            input,
            init: init ?? {}, state: FetchState.UNSENT,
            userData: null
          },
          localStates: []
        }
        ctx.userData = globalState

        logger.debug('fetch request ctx:', globalState.fetchCtx)

        return HookResult.EXECUTION_CONTINUE
      }, HookType.PRE)
      hook.install(ctx => {
        const globalState = ctx.userData as GlobalFetchState<U>
        if (globalState == null) {
          logger.error('missing global state')
          return HookResult.EXECUTION_IGNORE
        }

        ctx.returnValue = Promise.all(globalState.localStates.map(localState => localState.promise))
          .then(() => InterceptFetch.doFetch(ctx.origin, globalState.fetchCtx))
          .then((fetchCtx: FetchContext<U>) => Promise.all(globalState.localStates.map(localState => localState.callback(fetchCtx))).then(() => fetchCtx))
          .then((fetchCtx: FetchContext<U>) => {
            logger.debug('fetch response ctx:', fetchCtx)

            return new Promise<Response>((resolve, reject) => {
              switch (fetchCtx.state) {
                case FetchState.SUCCESS:
                  return resolve(fetchCtx.response)
                case FetchState.FAILED:
                  return reject(fetchCtx.error)
                default:
                  reject(new Error('invalid state'))
              }
            })
          })

        return HookResult.EXECUTION_CONTINUE
      }, HookType.POST)

      logger.debug('fetch hook activated')
    }

    hook.install(ctx => {
      const globalState = ctx.userData as GlobalFetchState<U>
      if (globalState == null) {
        logger.error('missing global state')
        return HookResult.EXECUTION_IGNORE
      }

      const { fetchCtx, localStates } = globalState

      localStates.push({
        promise: Promise.resolve(callback(fetchCtx)),
        callback
      })

      return fetchCtx.state === FetchState.UNSENT ? HookResult.EXECUTION_CONTINUE : HookResult.EXECUTION_RETURN
    })
  }

  /// Private ///

  private static hook: Hook<void, [input: FetchInput, init?: RequestInit | undefined], Promise<Response>, GlobalFetchState> | null = null

  private static async doFetch<U = unknown>(origin: typeof fetch, fetchCtx: FetchContext<U>): Promise<FetchContext<U>> {
    if (fetchCtx.state !== FetchState.UNSENT) return fetchCtx

    try {
      return {
        ...fetchCtx,
        state: FetchState.SUCCESS,
        response: await origin(fetchCtx.input, fetchCtx.init)
      }
    } catch (error) {
      return {
        ...fetchCtx,
        state: FetchState.FAILED,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }
}