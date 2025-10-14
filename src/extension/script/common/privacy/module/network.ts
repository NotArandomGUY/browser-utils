import { Feature } from '@ext/lib/feature'
import { NetworkContextState, NetworkState } from '@ext/lib/intercept/network'
import { addInterceptNetworkUrlFilter, removeInterceptNetworkUrlFilter } from '@ext/lib/intercept/network/filter/url'
import { buildHostnameRegexp } from '@ext/lib/regexp'

const FORBID_PATTERNS = [
  [buildHostnameRegexp(['licensing.bitmovin.com']), /./],
  [buildHostnameRegexp(['ingest.sentry.io']), /./]
] satisfies [RegExp, RegExp][]
const FORBID_CONTEXT_STATE = { state: NetworkState.FAILED, error: new Error('Failed') } satisfies NetworkContextState

export default class PrivacyNetworkModule extends Feature {
  public constructor() {
    super('network')
  }

  protected activate(): boolean {
    for (const [hostPattern, pathPattern] of FORBID_PATTERNS) addInterceptNetworkUrlFilter(hostPattern, pathPattern, FORBID_CONTEXT_STATE)

    return true
  }

  protected deactivate(): boolean {
    for (const [hostPattern] of FORBID_PATTERNS) removeInterceptNetworkUrlFilter(hostPattern)

    return true
  }
}