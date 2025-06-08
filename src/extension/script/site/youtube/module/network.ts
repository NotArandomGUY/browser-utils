import { Feature } from '@ext/lib/feature'
import InterceptFetch, { FetchContext, FetchContextState, FetchInput, FetchState } from '@ext/lib/intercept/fetch'
import InterceptImage from '@ext/lib/intercept/image'
import InterceptXMLHttpRequest from '@ext/lib/intercept/xhr'
import Logger from '@ext/lib/logger'
import { buildPathnameRegexp } from '@ext/lib/regexp'
import { processYTRenderer } from '@ext/site/youtube/api/processor'
import { isYTLoggedIn } from '@ext/site/youtube/module/bootstrap'

const logger = new Logger('YT-NETWORK')

const enum RequestBehaviour {
  NORMAL,
  PASSTHROUGH,
  INTERRUPT,
  BLOCK
}

const BYPASS_ID = '__ytbu_bpid__'
const BLOCKED_PATH_REGEXP = buildPathnameRegexp([
  '/api/stats',
  '/ddm',
  '/log',
  '/ptracking',
  '/youtubei/v1/att/log',
  '/youtubei/v1/log_event',
  '/youtubei/v1/player/ad_break'
])
const INTERRUPT_PATH_REGEXP = buildPathnameRegexp([
  '/generate_204',
  '/pagead',
  '/videoplayback\\?.*?&ctier=L&.*?%2Cctier%2C.*'
])
const LOGIN_WHITELIST_PATH = buildPathnameRegexp([
  '/api/stats/(playback|delayplay|watchtime)'
])

const bypassIdSet = new Set<number>()

function getRequestBehaviour(url: URL, input?: FetchInput, init?: RequestInit): RequestBehaviour {
  const bypassId = Number(init != null && BYPASS_ID in init ? init[BYPASS_ID] : null)
  if (bypassIdSet.has(bypassId)) {
    bypassIdSet.delete(bypassId)
    return RequestBehaviour.PASSTHROUGH
  }

  const path = url.pathname + url.search

  // Ignore request with fake url
  if (input instanceof Request && Object.getOwnPropertyDescriptor(input, 'url')?.get?.toString().includes(url.pathname)) return RequestBehaviour.PASSTHROUGH

  if (isYTLoggedIn() && LOGIN_WHITELIST_PATH.test(path)) return RequestBehaviour.NORMAL
  if (INTERRUPT_PATH_REGEXP.test(path)) return RequestBehaviour.INTERRUPT
  if (BLOCKED_PATH_REGEXP.test(path)) return RequestBehaviour.BLOCK

  return RequestBehaviour.NORMAL
}

function processResponse(url: URL, data: object): boolean {
  switch (url.pathname) {
    case '/youtubei/v1/browse':
      processYTRenderer('browseResponse', data)
      return true
    case '/youtubei/v1/browse/edit_playlist':
      processYTRenderer('browseEditPlaylistResponse', data)
      return true
    case '/youtubei/v1/guide':
      processYTRenderer('guideResponse', data)
      return true
    case '/youtubei/v1/live_chat/get_live_chat':
      processYTRenderer('liveChatGetLiveChatResponse', data)
      return true
    case '/youtubei/v1/next':
      processYTRenderer('nextResponse', data)
      return true
    case '/youtubei/v1/player':
      processYTRenderer('playerResponse', data)
      return true
    case '/youtubei/v1/player/heartbeat':
      processYTRenderer('playerHeartbeatResponse', data)
      return true
    case '/youtubei/v1/reel/reel_item_watch':
      processYTRenderer('reelReelItemWatchResponse', data)
      return true
    case '/youtubei/v1/reel/reel_watch_sequence':
      processYTRenderer('reelReelWatchSequenceResponse', data)
      return true
    case '/youtubei/v1/search':
      processYTRenderer('searchResponse', data)
      return true
    case '/youtubei/v1/updated_metadata':
      processYTRenderer('updatedMetadataResponse', data)
      return true
    default:
      return false
  }
}

export function bypassFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const bypassId = Date.now() + Math.floor(Math.random() * 1e6) - 5e5
  Object.defineProperty(init, BYPASS_ID, { value: bypassId })
  bypassIdSet.add(bypassId)
  return fetch(input, init)
}

export default class YTNetworkModule extends Feature {
  protected activate(): boolean {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: null
    })

    InterceptXMLHttpRequest.setCallback<RequestBehaviour>(function (type) {
      const url = this.requestURL
      switch (type) {
        case 'loadstart': {
          const behaviour = getRequestBehaviour(url)
          this.userData = behaviour

          switch (behaviour) {
            case RequestBehaviour.BLOCK:
              // Abort blocked request
              logger.debug('xhr blocked:', url.href)
              this.abort()
              break
            case RequestBehaviour.INTERRUPT:
              // Generate empty response for interrupted request
              logger.debug('xhr interrupt:', url.href)
              this.generateResponse('')
              break
          }
          break
        }
        case 'load': {
          if (this.userData === RequestBehaviour.PASSTHROUGH) {
            logger.debug('xhr passthrough:', url.href)
            break
          }

          let data = null
          try { data = JSON.parse(this.responseText) } catch { }

          if (processResponse(url, data)) this.setOverrideResponse(data)

          logger.debug('xhr response:', url.href, data)
          break
        }
      }
    })

    InterceptFetch.setCallback<RequestBehaviour>(async (ctx) => {
      switch (ctx.state) {
        case FetchState.UNSENT: {
          const behaviour = getRequestBehaviour(ctx.url, ctx.input, ctx.init)
          ctx.userData = behaviour

          switch (behaviour) {
            case RequestBehaviour.BLOCK:
              // Force blocked request to fail
              logger.debug('fetch blocked:', ctx.url.href)
              Object.assign<FetchContext, FetchContextState>(ctx, { state: FetchState.FAILED, error: new Error('Failed') })
              break
            case RequestBehaviour.INTERRUPT:
              // Generate empty response for interrupted request
              logger.debug('fetch interrupt:', ctx.url.href)
              Object.assign<FetchContext, FetchContextState>(ctx, { state: FetchState.SUCCESS, response: new Response(undefined, { status: 403 }) })
              break
          }
          break
        }
        case FetchState.SUCCESS: {
          const { url, response } = ctx

          if (ctx.userData === RequestBehaviour.PASSTHROUGH) {
            logger.debug('fetch passthrough:', url.href)
            break
          }

          let data = null
          try { data = await response.clone().json() } catch { }

          if (processResponse(url, data)) ctx.response = new Response(JSON.stringify(data), { headers: Object.fromEntries(response.headers.entries()) })

          logger.debug('fetch response:', url.href, data)
          break
        }
      }
    })

    InterceptImage.setCallback(function (type, evt) {
      if (type !== 'srcchange') return

      const url = new URL((<CustomEvent<string>>evt).detail, location.href)

      // Abort blocked or interrupted request
      if (getRequestBehaviour(url) !== RequestBehaviour.PASSTHROUGH) {
        evt.preventDefault()
        return
      }

      logger.debug('image load:', url.pathname)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}