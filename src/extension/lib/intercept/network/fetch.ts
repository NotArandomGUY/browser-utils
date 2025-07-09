import Hook, { HookResult } from '@ext/lib/intercept/hook'
import { NetworkContext, NetworkRequestCallback, NetworkResponseCallback, NetworkResponseContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('INTERCEPT-FETCH')

let hook: Hook<unknown, [input: RequestInfo | URL, init?: RequestInit], Promise<Response>> | null = null

const doFetch = async (origin: typeof fetch, ctx: NetworkContext): Promise<NetworkResponseContext> => {
  if (ctx.state !== NetworkState.UNSENT) return ctx

  try {
    return {
      ...ctx,
      state: NetworkState.SUCCESS,
      response: await origin(ctx.request)
    }
  } catch (error) {
    return {
      ...ctx,
      state: NetworkState.FAILED,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

export const registerInterceptNetworkFetchModule = (onRequest: NetworkRequestCallback, onResponse: NetworkResponseCallback): void => {
  if (hook != null) return

  hook = new Hook(window.fetch).install(ctx => {
    const { origin, args } = ctx
    const [input, init] = args

    ctx.returnValue = onRequest(input, init)
      .then(ctx => doFetch(origin, ctx))
      .then(onResponse)
      .then(ctx => {
        return new Promise<Response>((resolve, reject) => {
          switch (ctx.state) {
            case NetworkState.SUCCESS:
              return resolve(ctx.response)
            case NetworkState.FAILED:
              return reject(ctx.error)
            default:
              reject(new Error('invalid state'))
          }
        })
      })

    return HookResult.EXECUTION_CONTINUE
  })

  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: hook.call
  })

  logger.debug('fetch hook activated')
}

export const unregisterInterceptNetworkFetchModule = (): void => {
  if (hook == null) return

  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: hook.origin
  })

  hook = null

  logger.debug('fetch hook deactivated')
}