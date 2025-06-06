import Logger from '@ext/lib/logger'
import ProxyChain, { ProxyChainOptions } from '@ext/lib/proxy/chain'

const logger = new Logger('ADBLOCK-NAVIGATOR')

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

export default function initAdblockNavigatorModule(): void {
  if (!('navigator' in window)) return

  const userAgent = new ProxyChain({
    ...UserAgentProxyOptions,
    target: window.navigator.userAgent,
    trace: ['ADBLOCK', 'navigator', 'userAgent']
  })

  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    enumerable: false,
    get() {
      return userAgent
    }
  })
}