import { floor } from '@ext/global/math'
import { assign, entries, fromEntries } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import ViuLSHandleHistory from '@ext/site/viu/local-server/history'
import ViuLSHandleWatchTimeLine from '@ext/site/viu/local-server/timeline'
import { onNetworkPlaybackDistribute } from '@ext/site/viu/module/player'
import { VIU_STATE } from '@ext/site/viu/state'

function getTimeSecond(date: Date = new Date()): number {
  return floor(date.getTime() / 1e3)
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

async function processRequest(ctx: NetworkRequestContext): Promise<void> {
  if (VIU_STATE.loggedIn) return

  let data: object
  switch (ctx.url.pathname) {
    case '/api/config':
      data = {
        carrier: { id: '0' },
        ip: '127.0.0.1',
        countryCode: 'HK'
      }
      break
    case '/api/account/validate':
      data = makeApiResponse({})
      break
    case '/api/concurrency/device':
      data = {} // No data
      break
    case '/api/concurrency/deviceList':
      data = {
        deviceList: [
          {
            deviceId: '00000000-0000-0000-0000-000000000000',
            displayName: 'BU Extension',
            lastLoginTime: '',
            lastLoginUnixTime: Date.now(),
            platform: 'br'
          }
        ]
      }
      break
    case '/api/log/user/watchTimeline':
      data = ViuLSHandleWatchTimeLine(ctx.request.method, ctx.url, await ctx.request.clone().text())
      break
    case '/api/subscription/detail':
      data = {} // No data
      break
    case '/api/subscription/featureList':
      data = {
        features: []
      }
      break
    case '/api/subscription/paymentHistory':
      data = makeApiResponse({
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
      })
      break
    case '/api/subscription/plan':
      data = {
        user_plan: []
      }
      break
    case '/api/subscription/status':
      data = {
        plan: {
          name: 'PremiumP_0',
          partners: []
        }
      }
      break
    case '/api/subscription/unsubscribe':
      data = makeApiResponse({})
      break
    case '/api/user/bookmark':
      data = {
        tv: [],
        movie: []
      }
      break
    case '/api/user/bookmarkSimple':
      data = makeApiResponse({
        bookmarkSimple: {
          series_id: []
        }
      })
      break
    case '/api/user/history':
      data = ViuLSHandleHistory(ctx.request.method, ctx.url, await ctx.request.clone().text())
      break
    case '/api/user/privacy':
      data = makeApiResponse({})
      break
    case '/spu/bff/v2/paymentDetail':
      data = makeApiResponse({
        subscription: {
          provider: 'BU Extension',
          isRecurringSubscription: true,
          isRecurringCanceled: false,
          planValidUntil: `${floor(new Date().setFullYear(new Date().getFullYear() + 2) / 1e3)}`,
          skuInfo: {
            deactivation_allowed_off_network: false
          }
        },
        payments: []
      })
      break
    default:
      return
  }

  assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(JSON.stringify(await Promise.resolve(data))) })
}

async function processResponse(ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> { // NOSONAR
  const { url, response } = ctx

  let data = null
  try { data = await response.clone().json() } catch { }

  switch (url.pathname) {
    case '/api/mobile': {
      const { product_list, current_product, series, setting } = data?.data ?? {}

      if (product_list != null) {
        VIU_STATE.ccsProductIdMap.clear()
        for (const prod of product_list) VIU_STATE.ccsProductIdMap.set(prod.product_id, prod.ccs_product_id)

        assign(data.data, {
          product_list: product_list.map((prod: object) => assign(prod, {
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

        assign(current_product, {
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
        assign(series, {
          allow_telstb: '1',
          is_watermark: '0',
          watermark_url: null
        })
      }

      if (setting != null) {
        assign(setting, {
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
      break
    }
    case '/api/user/info': {
      const user = data?.data.user ?? {}

      // Create fake user if not logged in
      if (user.user_id == null) {
        VIU_STATE.loggedIn = false

        assign(user, {
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

      assign(data, {
        data: {
          user: assign(user, {
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
      })
      break
    }
    case '/api/subscription/status':
      assign(data, {
        hasSubscription: true,
        paymentStatus: 'premium+',
        plan: assign(data?.plan, {
          privileges: ['PREMIUM_PLUS_GRANTED', 'NO_ADS'],
          specialContentAllowed: 'SP_CONTENT_ALLOWED'
        }),
        dataTracking: { vuclipUserId: '00000000-0000-0000-0000-000000000000' }
      })
      break
    case '/api/playback/distribute': {
      VIU_STATE.streamSourceMap.clear()

      const stream = data.data?.stream
      if (stream == null) break

      const { url, url2 } = stream
      const urlList = <[string, string][]>[
        ...entries(url ?? {}).map(e => [`1${e[0]}`, e[1]]),
        ...entries(url2 ?? {}).map(e => [`2${e[0]}`, e[1]])
      ]

      for (const [id, url] of urlList) VIU_STATE.streamSourceMap.set(id, url)

      onNetworkPlaybackDistribute()
      break
    }
    default:
      switch (true) {
        case /\/production\/programmes\/.*?\/videos/.test(url.pathname):
          assign(data, {
            video: data?.video?.map((v: object) => assign(v, {
              isAdultContent: false,
              isDirty: false,
              offAirDate: new Date(new Date().getFullYear() + 10, 11, 31, 23, 59, 59).getTime(),
              midroll_adbreaks: [],
              requiredLogin: false
            })) ?? []
          })
          break
        case /\/encore\/.*/.test(url.pathname):
          ctx.response = new Response((await response.clone().text()).split('\n').map(patchRSC).join('\n'), { headers: fromEntries(response.headers.entries()) })
          return
        default:
          return
      }
  }

  ctx.response = new Response(JSON.stringify(data), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

export default class ViuNetworkModule extends Feature {
  protected activate(): boolean {
    addInterceptNetworkCallback(async ctx => {
      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processResponse(ctx)
          break
      }
    })

    self.__next_f = self.__next_f ?? []
    const nextPush = self.__next_f.push
    self.__next_f.forEach(e => e[1] = patchRSC(e[1]))
    self.__next_f.push = (...args) => nextPush.apply(self.__next_f, args.map(([id, rsc]) => <[number, string | null]>[id, patchRSC(rsc)]))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}