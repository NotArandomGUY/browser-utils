import { assign } from '@ext/global/object'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkState, removeInterceptNetworkCallback } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('INTERCEPT-NETWORK')

const patterns = new Array<[RegExp, RegExp, NetworkContextState]>()

const processRequest = (ctx: NetworkContext): void => {
  if (ctx.state !== NetworkState.UNSENT) return

  const { url } = ctx
  const host = url.hostname
  const path = url.pathname + url.search

  for (const [hostPattern, pathPattern, matchState] of patterns) {
    if (!hostPattern.test(host) || !pathPattern.test(path)) continue

    logger.debug('url filter hit:', host, path, matchState.state)
    assign<NetworkContext, NetworkContextState>(ctx, matchState.state === NetworkState.SUCCESS ? { ...matchState, response: matchState.response.clone() } : matchState)
    return
  }

  logger.debug('url filter miss:', host, path)
}

export const addInterceptNetworkUrlFilter = (hostPattern: RegExp, pathPattern: RegExp, matchState: NetworkContextState): void => {
  patterns.push([hostPattern, pathPattern, matchState])
  addInterceptNetworkCallback(processRequest)
}

export const removeInterceptNetworkUrlFilter = (hostPattern: RegExp): void => {
  while (true) {
    const index = patterns.findIndex(pattern => String(pattern[0]) === String(hostPattern))
    if (index < 0) break

    patterns.splice(index, 1)
  }

  if (patterns.length === 0) removeInterceptNetworkCallback(processRequest)
}