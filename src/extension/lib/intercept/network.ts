import { registerInterceptNetworkFetchModule, unregisterInterceptNetworkFetchModule } from '@ext/lib/intercept/network/fetch'
import { registerInterceptNetworkXHRModule, unregisterInterceptNetworkXHRModule } from '@ext/lib/intercept/network/xhr'
import Logger from '@ext/lib/logger'

export type RequestInput = string | URL | Request

export const enum NetworkState {
  UNSENT,
  SUCCESS,
  FAILED
}

export interface NetworkContextBase<U = unknown> {
  url: URL
  request: Request
  passthrough: boolean
  userData: U | null
}
export type NetworkContextState = { state: NetworkState.UNSENT } | { state: NetworkState.SUCCESS, response: Response } | { state: NetworkState.FAILED, error: Error }
export type NetworkContext<U = unknown, S extends NetworkState = NetworkState> = NetworkContextBase<U> & Extract<NetworkContextState, { state: S }>
export type NetworkRequestContext<U = unknown> = NetworkContext<U, NetworkState.UNSENT>
export type NetworkResponseContext<U = unknown> = NetworkContext<U, NetworkState.SUCCESS | NetworkState.FAILED>

export type NetworkRequestCallback<U = unknown> = (input: RequestInput, init?: RequestInit) => Promise<NetworkContext<U>>
export type NetworkResponseCallback<U = unknown> = (ctx: NetworkResponseContext<U>) => Promise<NetworkResponseContext<U>>

export type NetworkCallback<U = unknown> = (ctx: NetworkContext<U>) => Promise<void> | void

const logger = new Logger('INTERCEPT-NETWORK')

const callbacks = new Set<NetworkCallback>()

async function onRequest(input: RequestInput, init?: RequestInit): Promise<NetworkContext> {
  const request = new Request(input, init)
  const ctx: NetworkContext = {
    url: new URL(request.url),
    request,
    passthrough: false,
    userData: null,
    state: NetworkState.UNSENT
  }

  logger.trace('pre request:', ctx.url.href, ctx)

  for (const callback of callbacks) {
    if (ctx.passthrough || ctx.state !== NetworkState.UNSENT) break

    await callback(ctx)
  }

  logger.trace('post request:', ctx.url.href, ctx)

  return ctx
}

async function onResponse<U = unknown>(ctx: NetworkResponseContext<U>): Promise<NetworkResponseContext<U>> {
  logger.trace('pre response:', ctx.url.href, ctx)

  for (const callback of callbacks) {
    if (ctx.passthrough) break

    await callback(ctx)
  }

  logger.trace('post response:', ctx.url.href, ctx)

  return ctx
}

function registerInterceptNetworkModules(): void {
  registerInterceptNetworkFetchModule(onRequest, onResponse)
  registerInterceptNetworkXHRModule(onRequest, onResponse)
}

function unregisterInterceptNetworkModules(): void {
  unregisterInterceptNetworkFetchModule()
  unregisterInterceptNetworkXHRModule()
}

export function addInterceptNetworkCallback<U = unknown>(callback: NetworkCallback<U>): void {
  // Register modules on first callback added
  if (callbacks.size === 0) registerInterceptNetworkModules()

  callbacks.add(callback as NetworkCallback)
}

export function removeInterceptNetworkCallback<U = unknown>(callback: NetworkCallback<U>): void {
  callbacks.delete(callback as NetworkCallback)

  // Unregister modules on first callback added
  if (callbacks.size === 0) unregisterInterceptNetworkModules()
}