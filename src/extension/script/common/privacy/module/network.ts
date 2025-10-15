import { Feature } from '@ext/lib/feature'
import { NetworkContextState, NetworkState } from '@ext/lib/intercept/network'
import { addInterceptNetworkUrlFilter, removeInterceptNetworkUrlFilter } from '@ext/lib/intercept/network/filter/url'
import { ExtensionMessageSource, ExtensionMessageType, getExtensionMessageSender } from '@ext/lib/message/extension'
import { buildHostnameRegexp } from '@ext/lib/regexp'
import { MESSAGE_KEY } from '@virtual/package'

const { sendMessageToWorker } = getExtensionMessageSender(MESSAGE_KEY, ExtensionMessageSource.MAIN)

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
    sendMessageToWorker(ExtensionMessageType.PACKAGE_SCRIPT_NET_RULE, { scriptId: 'privacy', includeDomain: [location.host], excludeDomain: [] })

    for (const [hostPattern, pathPattern] of FORBID_PATTERNS) addInterceptNetworkUrlFilter(hostPattern, pathPattern, FORBID_CONTEXT_STATE)

    return true
  }

  protected deactivate(): boolean {
    sendMessageToWorker(ExtensionMessageType.PACKAGE_SCRIPT_NET_RULE, { scriptId: 'privacy', includeDomain: [], excludeDomain: [location.host] })

    for (const [hostPattern] of FORBID_PATTERNS) removeInterceptNetworkUrlFilter(hostPattern)

    return true
  }
}