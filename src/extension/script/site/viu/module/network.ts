import InterceptFetch, { FetchContext, FetchContextState, FetchState } from '@ext/lib/intercept/fetch'
import InterceptXMLHttpRequest from '@ext/lib/intercept/xhr'
import Logger from '@ext/lib/logger'
import ViuLSHandleHistory from '@ext/site/viu/local-server/history'
import ViuLSHandleWatchTimeLine from '@ext/site/viu/local-server/timeline'
import { onNetworkPlaybackDistribute } from '@ext/site/viu/module/player'
import { VIU_STATE } from '@ext/site/viu/state'

const logger = new Logger('VIU-NETWORK')

const BLOCKED_HOSTNAME = [
  'adsrvr.org',
  'licensing.bitmovin.com',
  'ingest.sentry.io'
]

function getTimeSecond(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1e3)
}

function makeApiResponse<T>(data: T) {
  return {
    data,
    server: {
      area: {
        area_id: 1,
        country: { code: 'HK', id: '1' },
        language: [
          { language_flag_id: '3', label: 'English', mark: 'en', is_default: '0' },
          { language_flag_id: '1', label: '繁體中文', mark: 'zh_hk', is_default: '1' }
        ],
        vuclip: true
      },
      time: getTimeSecond()
    },
    status: {
      code: 0,
      message: 'It is works!'
    }
  }
}

function patchRSC(line: string | null): string | null {
  if (line == null || line.length === 0) return null

  line = line.replace(/"isAdultContent":true/g, '"isAdultContent":false')
  line = line.replace(/"isDirty":true/g, '"isDirty":false')
  line = line.replace(/"offAirDate":\d+/g, `"offAirDate":${new Date(new Date().getFullYear() + 10, 11, 31, 23, 59, 59).getTime()}`)
  line = line.replace(/"requiredLogin":true/g, '"requiredLogin":false')
  line = line.replace(/"midroll_adbreaks":((".*?")|(\[.*?\]))/g, '"midroll_adbreaks":[]')

  return line
}

function onXHRLoadStart(this: InterceptXMLHttpRequest, url: URL): void {
  if (VIU_STATE.loggedIn) return

  if (BLOCKED_HOSTNAME.find(host => url.hostname.endsWith(host)) != null) {
    this.abort()
    logger.debug('xhr blocked:', url)
    return
  }

  switch (url.pathname) {
    case '/api/account/validate':
      this.generateResponse(makeApiResponse({}))
      break
    case '/api/concurrency/device':
      this.generateResponse({}) // No data
      break
    case '/api/concurrency/deviceList':
      this.generateResponse({
        deviceList: [
          {
            deviceId: '00000000-0000-0000-0000-000000000000',
            displayName: 'BU Extension',
            lastLoginTime: '',
            lastLoginUnixTime: Date.now(),
            platform: 'br'
          }
        ]
      })
      break
    case '/api/log/user/watchTimeline':
      this.generateResponse(ViuLSHandleWatchTimeLine(this.requestMethod, url, String(this.requestBody)))
      break
    case '/api/subscription/detail':
      this.generateResponse({}) // No data
      break
    case '/api/subscription/featureList':
      this.generateResponse({
        features: []
      })
      break
    case '/api/subscription/paymentHistory':
      this.generateResponse(makeApiResponse({
        subscription: {
          provider: 'BU Extension',
          is_recurring_subscription: true,
          is_recurring_canceled: false,
          plan_valid_until: `${new Date().getFullYear() + 2}/01/01`,
          sku_info: {
            deactivation_allowed_off_network: false
          }
        },
        payments: []
      }))
      break
    case '/api/subscription/plan':
      this.generateResponse({
        user_plan: []
      })
      break
    case '/api/subscription/status':
      this.generateResponse({
        plan: {
          name: 'PremiumP_0',
          partners: []
        }
      })
      break
    case '/api/subscription/unsubscribe':
      this.generateResponse(makeApiResponse({}))
      break
    case '/api/user/bookmark':
      this.generateResponse({
        tv: [],
        movie: []
      })
      break
    case '/api/user/bookmarkSimple':
      this.generateResponse(makeApiResponse({
        bookmarkSimple: {
          series_id: []
        }
      }))
      break
    case '/api/user/history':
      this.generateResponse(ViuLSHandleHistory(this.requestMethod, url, String(this.requestBody)))
      break
    case '/api/user/privacy':
      this.generateResponse(makeApiResponse({}))
      break
    case '/spu/bff/v2/paymentDetail':
      this.generateResponse(makeApiResponse({
        subscription: {
          provider: 'BU Extension',
          isRecurringSubscription: true,
          isRecurringCanceled: false,
          planValidUntil: `${Math.floor(new Date().setFullYear(new Date().getFullYear() + 2) / 1e3)}`,
          skuInfo: {
            deactivation_allowed_off_network: false
          }
        },
        payments: []
      }))
      break
  }
}

function onXHRLoadEnd(this: InterceptXMLHttpRequest, url: URL): void { // NOSONAR
  let data = null
  try { data = JSON.parse(this.responseText) } catch { }

  switch (url.pathname) {
    case '/api/config':
      this.setOverrideResponse({
        carrier: { id: '0' },
        ip: '127.0.0.1',
        countryCode: 'HK'
      })
      break
    case '/api/mobile': {
      const { product_list, current_product, series, setting } = data?.data ?? {}

      if (product_list != null) {
        VIU_STATE.ccsProductIdMap.clear()
        for (const prod of product_list) VIU_STATE.ccsProductIdMap.set(prod.product_id, prod.ccs_product_id)

        Object.assign(data.data, {
          product_list: product_list.map((prod: object) => Object.assign(prod, {
            allow_download: 1,
            allow_telstb: '1',
            allow_tv: '1',
            is_parental_lock_compulsory: '0',
            is_parental_lock_limited: '0'
          }))
        })
      }

      if (current_product != null) {
        VIU_STATE.currentProductId = current_product.product_id

        Object.assign(current_product, {
          ad: [],
          vmap_ad: { enabled: '0' },
          allow_download: 1,
          allow_telstb: '1',
          allow_tv: '1',
          is_parental_lock_compulsory: '0',
          is_parental_lock_limited: '0',
          censorship_ads_mp4_url: null
        })
      }

      if (series != null) {
        Object.assign(series, {
          allow_telstb: '1',
          is_watermark: '0',
          watermark_url: null
        })
      }

      if (setting != null) {
        Object.assign(setting, {
          ad: null,
          ad_account: null,
          fan_ad: { pre_ad: null, mid_ad: null },
          inmobil_ad: { pre_ad: null, mid_ad: null },
          video: { sync_play_interval: 5 },
          has_movie: '1',
          has_parental_lock_function: '1',
          has_tv_login_function: '1',
          play_fan_ad_in_exo: '0',
          premium_plus_button_is_display: '0'
        })
      }

      this.setOverrideResponse(data)
      break
    }
    case '/api/user/info': {
      const user = data?.data.user ?? {}

      // Create fake user if not logged in
      if (user.user_id == null) {
        VIU_STATE.loggedIn = false

        Object.assign(user, {
          account_type: 0,
          type: 3,
          user_id: 1,
          user_level: 3,
          user_name: 'Local BU',
          nickname: 'Local BU',
          head_portrait_url: 'https://freegameassets.net/wp-content/uploads/2020/12/icon-5.jpg',
          mobile: '999',
          social_account_email: 'bu@localhost',
          social_account_id: 'bu-localhost',
          last_login_time: getTimeSecond()
        })
      } else {
        VIU_STATE.loggedIn = true
      }

      this.setOverrideResponse(Object.assign(data, {
        data: {
          user: Object.assign(user, {
            privileges: {
              planName: user.privileges.planName,
              ads: 'NO_ADS',
              specialContentAllowed: 'SP_CONTENT_ALLOWED',
              downloads: 0,
              contentQuality: 'FULL_HD',
              content: 'PREMIUM_PLUS_GRANTED',
              concurrency: 4,
              unbind: false,
              is_upgrade_plus: 0
            },
            permit: {
              download: { expire_days: 7, total_count: 0, concurrent_count: 2 },
              resolution: { p1080: '1', p720: '1', p480: '1', p240: '1' },
              non_premium_preview_time: '180',
              user_level: 3,
              city: { name: 'HK' }
            },
            vuclip_user_id: '00000000-0000-0000-0000-000000000000'
          })
        }
      }))
      break
    }
    case '/api/subscription/status':
      this.setOverrideResponse(Object.assign(data, {
        hasSubscription: true,
        paymentStatus: 'premium+',
        plan: Object.assign(data?.plan, {
          privileges: ['PREMIUM_PLUS_GRANTED', 'NO_ADS'],
          specialContentAllowed: 'SP_CONTENT_ALLOWED'
        }),
        dataTracking: { vuclipUserId: '00000000-0000-0000-0000-000000000000' }
      }))
      break
    case '/api/playback/distribute': {
      VIU_STATE.streamSourceMap.clear()

      const { url, url2 } = data.data.stream
      const urlList = <[string, string][]>[
        ...Object.entries(url ?? {}).map(e => [`1${e[0]}`, e[1]]),
        ...Object.entries(url2 ?? {}).map(e => [`2${e[0]}`, e[1]])
      ]

      for (const [id, url] of urlList) VIU_STATE.streamSourceMap.set(id, url)

      onNetworkPlaybackDistribute()
      break
    }
    default:
      logger.debug('xhr passthrough:', url.pathname, this.response)
      break
  }
}

export default function initViuNetworkModule(): void {
  InterceptXMLHttpRequest.setCallback(function (type, evt) {
    const url = this.requestURL
    switch (type) {
      case 'loadstart':
        return onXHRLoadStart.call(this, url)
      case 'loadend':
        return onXHRLoadEnd.call(this, url)
    }
  })

  InterceptFetch.setCallback(async (ctx) => {
    if (ctx.state !== FetchState.SUCCESS) {
      if (ctx.state !== FetchState.UNSENT || BLOCKED_HOSTNAME.find(host => ctx.url.hostname.endsWith(host)) == null) return

      // Force blocked request to fail
      logger.debug('fetch blocked:', ctx.url)
      Object.assign<FetchContext, FetchContextState>(ctx, { state: FetchState.FAILED, error: new Error('Failed') })
      return
    }

    const { url, response } = ctx

    let data = null
    try { data = await response.clone().json() } catch { }

    switch (true) {
      case /\/encore\/.*/.test(url.pathname):
        ctx.response = new Response((await response.clone().text()).split('\n').map(patchRSC).join('\n'), { headers: { 'Content-Type': 'text/x-component' } })
        break
      case /\/production\/programmes\/.*?\/videos/.test(url.pathname):
        ctx.response = new Response(JSON.stringify(Object.assign(data, {
          video: data?.video?.map((v: object) => Object.assign(v, {
            isAdultContent: false,
            isDirty: false,
            offAirDate: new Date(new Date().getFullYear() + 10, 11, 31, 23, 59, 59).getTime(),
            midroll_adbreaks: [],
            requiredLogin: false
          })) ?? []
        })), { headers: { 'Content-Type': 'application/json' } })
        break
      default:
        logger.debug('fetch passthrough:', url.pathname, data)
        break
    }
  })

  self.__next_f = self.__next_f ?? []
  const nextPush = self.__next_f.push
  self.__next_f.forEach(e => e[1] = patchRSC(e[1]))
  self.__next_f.push = (...args) => nextPush.apply(self.__next_f, args.map(([id, rsc]) => <[number, string | null]>[id, patchRSC(rsc)]))
}
