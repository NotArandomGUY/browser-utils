import { processYTRenderer } from '@ext/custom/youtube/api/processor'
import { registerYTConfigInitCallback, type YTPlayerWebPlayerContextConfig } from '@ext/custom/youtube/module/core/bootstrap'
import { dispatchYTOpenPopupAction } from '@ext/custom/youtube/module/core/event'
import OnesieRequest from '@ext/custom/youtube/proto/onesie-request'
import { OnesieHttpHeader } from '@ext/custom/youtube/proto/onesie/common'
import OnesieEncryptedInnertubeRequest from '@ext/custom/youtube/proto/onesie/encrypted-innertube-request'
import OnesieEncryptedInnertubeResponse from '@ext/custom/youtube/proto/onesie/encrypted-innertube-response'
import OnesieInnertubeRequest from '@ext/custom/youtube/proto/onesie/innertube-request'
import OnesieInnertubeResponse, { OnesieProxyStatus } from '@ext/custom/youtube/proto/onesie/innertube-response'
import SabrRequest from '@ext/custom/youtube/proto/sabr-request'
import { UMPType } from '@ext/custom/youtube/proto/ump'
import UMPFormatInitializationMetadata from '@ext/custom/youtube/proto/ump/format-initialization-metadata'
import UMPFormatSelectionConfig from '@ext/custom/youtube/proto/ump/format-selection-config'
import UMPMediaHeader from '@ext/custom/youtube/proto/ump/media-header'
import UMPNextRequestPolicy from '@ext/custom/youtube/proto/ump/next-request-policy'
import UMPOnesieHeader, { OnesieHeaderType } from '@ext/custom/youtube/proto/ump/onesie-header'
import UMPPlaybackStartPolicy from '@ext/custom/youtube/proto/ump/playback-start-policy'
import UMPSabrContextUpdate, { UMPSabrContextScope, UMPSabrContextValue } from '@ext/custom/youtube/proto/ump/sabr-context-update'
import UMPSabrContextContentAds from '@ext/custom/youtube/proto/ump/sabr-context/content-ads'
import UMPSabrError from '@ext/custom/youtube/proto/ump/sabr-error'
import UMPSnackbarMessage from '@ext/custom/youtube/proto/ump/snackbar-message'
import { decryptOnesie, encryptOnesie } from '@ext/custom/youtube/utils/crypto'
import { UMPContext, UMPSliceFlags } from '@ext/custom/youtube/utils/ump'
import { ceil } from '@ext/global/math'
import { URLSearchParams } from '@ext/global/network'
import { assign, fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkRequestContext, NetworkState, onInterceptNetworkRequest, replaceRequest } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTPLAYER-UMP')

const UMP_PATHNAME_REGEXP = /^\/(init|video)playback$/
const JSON_PREFIX_REGEXP = /^\)]}'\n/

let isFirstInterrupt = true
let onesieClientKeys: Uint8Array[] = []
let onesieHeader: InstanceType<typeof UMPOnesieHeader> | null = null

const ump = new UMPContext({
  [UMPType.UNKNOWN]: (_, slice) => logger.trace('slice type:', slice.getType(), 'size:', slice.getSize()),
  [UMPType.ONESIE_HEADER]: (data) => {
    onesieHeader = new UMPOnesieHeader().deserialize(data)

    logger.trace('onesie header:', onesieHeader)
  },
  [UMPType.ONESIE_DATA]: async (data, slice) => {
    if (onesieHeader == null) {
      logger.warn('onesie data without header')
      slice.setFlag(UMPSliceFlags.DEFER_OR_DROP)
      return
    }

    const { type, cryptoParams } = onesieHeader

    switch (type) {
      case OnesieHeaderType.PLAYER_RESPONSE: {
        const [decryptedData, key] = await decryptOnesie(data, onesieClientKeys, cryptoParams)
        const message = new OnesieInnertubeResponse().deserialize(decryptedData)

        let body: object | null = null
        if (message.onesiePorxyStatus === OnesieProxyStatus.OK && message.body != null) {
          body = JSON.parse(bufferToString(message.body))
          await processYTRenderer('playerResponse', body)
          message.body = bufferFromString(JSON.stringify(body))
        }
        logger.debug('onesie player response:', message, body)

        slice.setData(await encryptOnesie(message.serialize(), key, cryptoParams))
        return
      }
      case OnesieHeaderType.ENCRYPTED_INNERTUBE_RESPONSE_PART: {
        const message = new OnesieEncryptedInnertubeResponse().deserialize(data)

        logger.debug('onesie encrypted innertube response:', message)
        return
      }
      default:
        logger.debug('onesie data type:', type, 'size:', data.length)
        return
    }
  },
  [UMPType.MEDIA_HEADER]: (data) => {
    const message = new UMPMediaHeader().deserialize(data)

    logger.trace('media header:', message)
  },
  [UMPType.MEDIA]: (data) => logger.trace('media size:', data.length),
  [UMPType.MEDIA_END]: (data) => logger.trace('media end:', data),
  [UMPType.NEXT_REQUEST_POLICY]: (data) => {
    const message = new UMPNextRequestPolicy().deserialize(data)

    logger.trace('next request policy:', message)
  },
  [UMPType.FORMAT_SELECTION_CONFIG]: (data) => {
    const message = new UMPFormatSelectionConfig().deserialize(data)

    logger.debug('format selection config:', message)
  },
  [UMPType.FORMAT_INITIALIZATION_METADATA]: (data) => {
    const message = new UMPFormatInitializationMetadata().deserialize(data)

    logger.debug('format initialization metadata:', message)
  },
  [UMPType.SABR_ERROR]: (data) => {
    const message = new UMPSabrError().deserialize(data)

    logger.warn('sabr error:', message)
  },
  [UMPType.PLAYBACK_START_POLICY]: (data) => {
    const message = new UMPPlaybackStartPolicy().deserialize(data)

    logger.trace('playback start policy:', message)
  },
  [UMPType.SABR_CONTEXT_UPDATE]: (data) => {
    const message = new UMPSabrContextUpdate().deserialize(data)

    logger.debug('sabr context update:', message)

    if (message.type === 5 && message.scope === UMPSabrContextScope.SABR_CONTEXT_SCOPE_CONTENT_ADS && message.value != null) {
      const value = new UMPSabrContextValue().deserialize(message.value)
      if (value.content == null) return

      const context = new UMPSabrContextContentAds().deserialize(value.content)

      const backoffTimeMs = context.backoffTimeMs ?? 0
      if (backoffTimeMs <= 0) return

      if (isFirstInterrupt) {
        isFirstInterrupt = false
        throw new Response(null, { status: 403 })
      }

      dispatchYTOpenPopupAction({
        durationHintMs: backoffTimeMs,
        popup: {
          notificationActionRenderer: {
            responseText: { runs: [{ text: `Waiting for server ad delay (${ceil(backoffTimeMs / 1e3)}s)...` }] }
          }
        },
        popupType: 'TOAST'
      })
    }
  },
  [UMPType.SNACKBAR_MESSAGE]: (data, slice) => {
    const message = new UMPSnackbarMessage().deserialize(data)

    logger.debug('snackbar message:', message)
    slice.setFlag(UMPSliceFlags.DEFER_OR_DROP)
  }
})

const loadPlayerContextConfig = (webPlayerContextConfig: Record<string, YTPlayerWebPlayerContextConfig>): void => {
  if (webPlayerContextConfig == null) return

  for (const id in webPlayerContextConfig) {
    const config = webPlayerContextConfig[id]
    if (config == null) continue

    const { serializedExperimentFlags, onesieHotConfig } = config

    const flags = new URLSearchParams(serializedExperimentFlags)

    flags.set('html5_force_hfr_support', 'true')
    flags.set('html5_tv_ignore_capable_constraint', 'true')

    config.serializedExperimentFlags = flags.toString()

    const clientKey = onesieHotConfig?.clientKey
    if (clientKey == null) continue

    onesieClientKeys.push(bufferFromString(atob(clientKey), 'latin1'))
    logger.debug('load onesie client key:', onesieClientKeys, 'config:', webPlayerContextConfig)
  }
}

const processOnesieInnertubeRequest = async (innertubeRequest: InstanceType<typeof OnesieEncryptedInnertubeRequest> | null): Promise<void> => {
  if (innertubeRequest == null) return

  const { encryptedOnesieInnertubeRequest, iv, unencryptedOnesieInnertubeRequest } = innertubeRequest

  let onesieRequest = unencryptedOnesieInnertubeRequest
  let encryptionKey = null

  if (encryptedOnesieInnertubeRequest != null && iv?.length === 16) {
    const [data, key] = await decryptOnesie(encryptedOnesieInnertubeRequest, onesieClientKeys, innertubeRequest)
    onesieRequest = new OnesieInnertubeRequest().deserialize(data)
    encryptionKey = key
  }

  if (onesieRequest == null) {
    logger.warn('empty innertube request')
    return
  }

  const { request } = await onInterceptNetworkRequest(onesieRequest.urls?.[0] ?? location.href, {
    method: 'POST',
    headers: Object.fromEntries(onesieRequest.headers?.map(e => [e.name, e.value]) ?? []),
    body: onesieRequest.body
  })

  onesieRequest.headers = Array.from(request.headers.entries()).map(e => new OnesieHttpHeader({ name: e[0].replace(/(^|-)[a-z]/g, c => c.toUpperCase()), value: e[1] }))
  onesieRequest.body = new Uint8Array(await request.arrayBuffer())

  if (encryptionKey != null) {
    innertubeRequest.encryptedOnesieInnertubeRequest = await encryptOnesie(onesieRequest.serialize(), encryptionKey, innertubeRequest)
    innertubeRequest.unencryptedOnesieInnertubeRequest = null
  }
}

const processUMPRequest = async (ctx: NetworkRequestContext): Promise<void> => {
  const { url, request } = ctx

  if (url.searchParams.has('expire')) {
    const ttl = Number(url.searchParams.get('expire')) - (Date.now() / 1e3)
    if (isNaN(ttl) || ttl < 0 || ttl > 604800) {
      logger.debug('blocked invalid ump request from sending')
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response(undefined, { status: 403 }) })
      return
    }
  }

  try {
    let body = new Uint8Array(await request.arrayBuffer())

    switch (url.pathname) {
      case '/initplayback': {
        const onesieRequest = new OnesieRequest().deserialize(body)

        logger.debug('onesie request:', onesieRequest)

        await processOnesieInnertubeRequest(onesieRequest.innertubeRequest)

        body = onesieRequest.serialize()
        break
      }
      case '/videoplayback': {
        const sabrRequest = new SabrRequest().deserialize(body)

        logger.debug('sabr request:', sabrRequest)

        body = sabrRequest.serialize()
        break
      }
    }

    await replaceRequest(ctx, { body })
  } catch (error) {
    if (error instanceof Response) {
      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: error })
      return
    }

    logger.error('process request error:', error)
  }
}

const processUMPResponse = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx

  if (url.searchParams.get('sabr') !== '1') return

  const error = await ump.feed(new Uint8Array(await response.arrayBuffer()), false)
  if (error != null) {
    if (error instanceof Response) {
      ctx.response = error
      return
    }
    logger.error('process response error:', error, error.slice)
  }

  ctx.response = new Response(ump.getBuffer(), { status: response.status, headers: fromEntries(response.headers.entries()) })
}

const processTVConfig = async (ctx: NetworkContext<unknown, NetworkState.SUCCESS>): Promise<void> => {
  const { url, response } = ctx
  const { searchParams } = url

  try {
    const data = await response.clone().text()
    const isPrefixed = JSON_PREFIX_REGEXP.test(data)
    const config = JSON.parse(data.replace(JSON_PREFIX_REGEXP, ''))

    if (searchParams.has('action_get_config')) {
      const { webPlayerContextConfig } = config

      loadPlayerContextConfig(webPlayerContextConfig)
    }

    ctx.response = new Response(`${isPrefixed ? ')]}\'\n' : ''}${JSON.stringify(data)}`, { status: response.status, headers: fromEntries(response.headers.entries()) })
  } catch (error) {
    logger.warn('process tv config error:', error)
  }
}

export default class YTPlayerUMPModule extends Feature {
  public constructor() {
    super('ump')
  }

  protected activate(): boolean {
    addInterceptNetworkCallback(async ctx => {
      const { url } = ctx

      if (url.hostname.startsWith('redirector.') || !UMP_PATHNAME_REGEXP.test(url.pathname)) {
        if (ctx.state === NetworkState.SUCCESS && url.pathname === '/tv_config') await processTVConfig(ctx)
        return
      }

      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processUMPRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processUMPResponse(ctx)
          break
      }
    })

    registerYTConfigInitCallback(ytcfg => loadPlayerContextConfig(ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS')))

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}