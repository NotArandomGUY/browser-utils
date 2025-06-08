import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import ProxyChain, { ProxyChainOptions } from '@ext/lib/proxy/chain'
import { buildHostnameRegexp } from '@ext/lib/regexp'

const logger = new Logger('ADBLOCK-NAVIGATOR')

// These sites doesn't like user agent to be changed and will get emotional damage from it
const WHITELIST_HOST_REGEXP = buildHostnameRegexp(['drive.google.com', 'reddit.com'])

// Some site disable tracking report & anti ad block check if user agent is a bot
const BOT_UA = ['googlebot', 'mediapartners-google', 'adsbot-google', 'facebookexternalhit', 'bingbot', 'bingpreview', 'googleweblight', 'yandex', 'cxensebot', 'duckduckbot', 'archive.org_bot', 'baiduspider', 'slurp', 'affilimate-puppeteer']

const UserAgentProxyOptions = {
  fixedProperties: true,
  properties: {
    includes: {
      invoke(this: string, searchString: string, position?: number) {
        if (BOT_UA.includes(searchString)) return true
        logger.trace('user agent includes:', searchString, position)
        return String(this).includes(searchString, position)
      },
      ignoreReturn: true
    },
    indexOf: {
      invoke(this: string, searchString: string, position?: number) {
        if (BOT_UA.includes(searchString)) return 0
        logger.trace('user agent indexOf:', searchString, position)
        return String(this).indexOf(searchString, position)
      },
      ignoreReturn: true
    },
    valueOf: {},
    get toString() {
      return UserAgentProxyOptions
    },
    get toLowerCase() {
      return UserAgentProxyOptions
    },
    get toUpperCase() {
      return UserAgentProxyOptions
    }
  },
  get return() {
    return UserAgentProxyOptions
  }
} as ProxyChainOptions<string>

export default class AdblockNavigatorModule extends Feature {
  private readonly hostname: string
  private readonly userAgent: string | undefined

  public constructor() {
    super()

    this.hostname = location.hostname
    this.userAgent = window.navigator?.userAgent
  }

  protected activate(): boolean {
    const { hostname, userAgent } = this

    // Ensure environment is valid
    if (typeof hostname !== 'string' || typeof userAgent !== 'string') throw new Error('invalid environment')

    // Don't start if host is in whitelist
    if (WHITELIST_HOST_REGEXP.test(this.hostname)) return false

    const userAgentProxy = new ProxyChain({
      ...UserAgentProxyOptions,
      target: userAgent,
      trace: ['ADBLOCK', 'navigator', 'userAgent']
    })

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      enumerable: false,
      get() { // NOSONAR
        return userAgentProxy
      }
    })

    return true
  }

  protected deactivate(): boolean {
    const { userAgent } = this

    // Ensure environment is valid
    if (typeof userAgent !== 'string') throw new Error('invalid environment')

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      enumerable: false,
      get() {
        return userAgent
      }
    })

    return true
  }
}