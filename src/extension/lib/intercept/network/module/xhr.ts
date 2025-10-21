import { URL } from '@ext/global/network'
import { assign } from '@ext/global/object'
import { bufferToString } from '@ext/lib/buffer'
import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import { NetworkContext, NetworkContextState, NetworkRequestCallback, NetworkResponseCallback, NetworkResponseContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { proxyBind } from '@ext/lib/proxy/bind'

type XHRRequestBody = Document | XMLHttpRequestBodyInit

const logger = new Logger('INTERCEPT-XHR')

const NULL_BODY_STATUS = [101, 204, 205, 304]
const HEADER_LINE_REGEXP = /^\s*(.*?)\s*:\s*(.*)\s*$/
const XHR_EVENT_MAP = {
  onabort: 'abort',
  onerror: 'error',
  onload: 'load',
  onloadend: 'loadend',
  onloadstart: 'loadstart',
  onprogress: 'progress',
  onreadystatechange: 'readystatechange',
  ontimeout: 'timeout'
} as const

let nativeXHR: (typeof XMLHttpRequest) | null = null
let onRequestCallback: NetworkRequestCallback | null = null
let onResponseCallback: NetworkResponseCallback | null = null

const responseBlob = (xhr: InterceptXMLHttpRequest): Blob | null => {
  const { status, responseType, response } = xhr

  if (NULL_BODY_STATUS.includes(status)) return null

  switch (responseType) {
    case 'arraybuffer':
      return new Blob([response as ArrayBuffer])
    case 'blob':
      return response as Blob
    case 'document':
      return new Blob([new XMLSerializer().serializeToString(response as Document)])
    case 'json':
      return new Blob([JSON.stringify(response)])
    case 'text':
    case '':
      return new Blob([String(response)])
    default:
      return null
  }
}

async function handleXHRSend(this: InterceptXMLHttpRequest): Promise<boolean> {
  if (onRequestCallback == null) return false

  const { requestMethod, requestHeaders, requestBody } = this

  const init: RequestInit = {
    method: requestMethod,
    headers: requestHeaders
  }
  switch (requestMethod.toUpperCase()) {
    case 'GET':
    case 'HEAD':
      break
    default:
      init.body = requestBody instanceof Document ? new XMLSerializer().serializeToString(requestBody) : requestBody
      break
  }

  const ctx = await onRequestCallback(this.requestURL, init)
  this.ctx = ctx

  // Invoke respective handler if response is set
  switch (ctx.state) {
    case NetworkState.SUCCESS:
      await handleXHRLoad.call(this)
      break
    case NetworkState.FAILED:
      await handleXHRError.call(this)
      break
    default: {
      const request = ctx.request.clone()
      this.requestMethod = request.method
      this.requestHeaders = Object.fromEntries(request.headers.entries())
      this.requestBody = await request.blob()
      return false
    }
  }

  return true
}

function handleXHRReadyStateChange(this: InterceptXMLHttpRequest): void {
  const readyState = this.internalReadyState
  if (readyState < 4) this.changeReadyState(readyState)
}

async function handleXHRLoad(this: InterceptXMLHttpRequest): Promise<void> {
  if (onResponseCallback == null) return

  const ctx = this.ctx
  if (ctx == null || ctx.passthrough) return

  // Create response context
  if (ctx.state === NetworkState.UNSENT) {
    assign<NetworkContext, NetworkContextState>(ctx, {
      state: NetworkState.SUCCESS,
      response: new Response(responseBlob(this), {
        status: this.status,
        headers: this.getAllResponseHeaders()
          .split('\n')
          .map(line => HEADER_LINE_REGEXP.exec(line)?.slice(1))
          .filter(entry => entry?.length === 2) as [string, string][]
      })
    })
  }

  await onResponseCallback(ctx as NetworkResponseContext)
  ctx.passthrough = true

  // Complete request
  await this.complete()
}

async function handleXHRError(this: InterceptXMLHttpRequest): Promise<void> {
  if (onResponseCallback == null) return

  const ctx = this.ctx
  if (ctx == null || ctx.passthrough) return

  // Create response context
  if (ctx.state === NetworkState.UNSENT) {
    assign<NetworkContext, NetworkContextState>(ctx, {
      state: NetworkState.FAILED,
      error: new Error('Network error')
    })
  }

  await onResponseCallback(ctx as NetworkResponseContext)
  ctx.passthrough = true

  // Complete request
  await this.complete()
}

function progressEvent<TTarget, TMap>(xhr: InterceptXMLHttpRequest, eventTarget: InterceptEventTargetAdapter<TTarget, TMap>, type: Extract<keyof TMap, string>): void {
  eventTarget.dispatchEvent(type, new ProgressEvent(type), xhr)
}

class InterceptXMLHttpRequest extends XMLHttpRequest {
  /// Public ///

  public ctx: NetworkContext | null
  public requestMethod: string
  public requestURL: URL
  public requestHeaders: Record<string, string>
  public requestBody: XHRRequestBody | null

  public constructor() {
    super()

    this.ctx = null

    this.requestMethod = 'GET'
    this.requestURL = new URL('/', location.origin)
    this.requestHeaders = {}
    this.requestBody = null
    this.overrideReadyState = 0
    this.overrideStatus = null
    this.overrideHeaders = null
    this.overrideResponse = null

    this.addEventListener('readystatechange', handleXHRReadyStateChange.bind(this))
    this.addEventListener('abort', handleXHRError.bind(this))
    this.addEventListener('error', handleXHRError.bind(this))
    this.addEventListener('timeout', handleXHRError.bind(this))
    this.addEventListener('load', handleXHRLoad.bind(this))

    const eventTarget = new InterceptEventTargetAdapter<XMLHttpRequest, XMLHttpRequestEventMap>(new EventTarget())
    const externalData: Record<string | symbol, unknown> = {}
    const prototype = (nativeXHR ?? window.XMLHttpRequest).prototype

    this.addEventListener = eventTarget.addEventListener.bind(eventTarget)
    this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget)
    this.eventTarget = eventTarget

    return new Proxy(this, { // NOSONAR
      get(target, p) {
        if (p in XHR_EVENT_MAP) {
          // Event listener getter
          return eventTarget.getEventListener(p as keyof typeof XHR_EVENT_MAP)
        } else if (p in prototype) {
          // Only allow access to native properties if exists
          const value = target[p as keyof typeof target]
          return typeof value === 'function' ? proxyBind(value, target) : value
        } else {
          // Use external data for properties that are not native
          return externalData[p]
        }
      },
      set(target, p, newValue) {
        if (p in XHR_EVENT_MAP) {
          // Event listener setter
          eventTarget.setEventListener(p as keyof typeof XHR_EVENT_MAP, XHR_EVENT_MAP[p as keyof typeof XHR_EVENT_MAP], newValue)
        } else if (p in prototype) {
          // Only allow access to native properties if exists
          target[p as keyof typeof target] = newValue
        } else {
          // Use external data for properties that are not native
          externalData[p] = newValue
        }

        return true
      }
    })
  }

  // Getter

  public get readyState(): number {
    return this.overrideReadyState
  }

  public get internalReadyState(): number {
    return super.readyState
  }

  public get status(): number {
    return this.overrideStatus ?? super.status
  }

  public get response(): any {
    const { overrideResponse } = this

    if (overrideResponse == null) return super.response

    switch (super.responseType) {
      case 'arraybuffer':
        return overrideResponse
      case 'blob':
        return new Blob([overrideResponse])
      case 'document':
        return this.responseXML
      case 'json':
        return JSON.parse(this.responseText)
      case 'text':
      case '':
        return this.responseText
      default:
        return null
    }
  }

  public get responseText(): string {
    const { overrideResponse } = this

    if (overrideResponse == null) return super.responseText

    return bufferToString(overrideResponse)
  }

  public get responseXML(): Document {
    return new DOMParser().parseFromString(this.responseText, 'text/xml')
  }

  // Method

  public setRequestHeader(name: string, value: string): void {
    this.requestHeaders[name] = value
  }

  public getAllResponseHeaders(): string {
    const { overrideHeaders } = this

    if (overrideHeaders == null) return super.getAllResponseHeaders()

    return overrideHeaders
  }

  public open(method: string, url: string | URL): void {
    if (typeof url === 'string') url = new URL(url, location.origin)

    this.requestMethod = method.toUpperCase()
    this.requestURL = url

    super.open(method, url)
  }

  public send(body?: XHRRequestBody): void {
    this.requestBody = body ?? null

    handleXHRSend.call(this)
      .then(isIntercepted => {
        if (isIntercepted) return

        const { requestHeaders, requestBody } = this

        for (const name in requestHeaders) {
          super.setRequestHeader(name, requestHeaders[name])
        }
        super.send(requestBody)
      })
      .catch(error => {
        logger.warn('send handler error:', error)
        this.abort()
      })
  }

  public changeReadyState(targetReadyState: number): void {
    const { ctx, readyState: currentReadyState, eventTarget } = this

    if (targetReadyState < currentReadyState) return

    if (targetReadyState === currentReadyState) {
      progressEvent(this, eventTarget, 'readystatechange')
      return
    }

    for (let readyState = currentReadyState + 1; readyState <= targetReadyState; readyState++) {
      this.overrideReadyState = readyState
      progressEvent(this, eventTarget, 'readystatechange')

      // Specific event for ready state
      switch (readyState) {
        case 2:
          progressEvent(this, eventTarget, 'loadstart')
          break
        case 4:
          if (ctx?.state === NetworkState.SUCCESS) {
            progressEvent(this, eventTarget, 'load')
          } else {
            progressEvent(this, eventTarget, 'error')
          }
          progressEvent(this, eventTarget, 'loadend')
          break
      }
    }
  }

  public async complete(): Promise<void> {
    const { ctx } = this

    if (ctx == null) return

    // Change ready state to LOADING
    this.changeReadyState(3)

    // Abort ongoing request
    if (super.readyState < 4) this.abort()

    // Set override status & response
    switch (ctx.state) {
      case NetworkState.SUCCESS: {
        const { response } = ctx

        this.overrideStatus = response.status
        this.overrideHeaders = Array.from(response.headers.entries()).map(e => `${e[0]}: ${e[1]}`).join('\r\n')
        this.overrideResponse = await response.arrayBuffer()
        break
      }
      case NetworkState.FAILED:
        this.overrideStatus = 0
        break
    }

    // Change ready state to DONE
    this.changeReadyState(4)
  }

  /// Private ///

  private readonly eventTarget: InterceptEventTargetAdapter<XMLHttpRequestEventTarget, XMLHttpRequestEventMap>
  private overrideReadyState: number
  private overrideStatus: number | null
  private overrideHeaders: string | null
  private overrideResponse: ArrayBuffer | null
}

export const registerInterceptNetworkXHRModule = (onRequest: NetworkRequestCallback, onResponse: NetworkResponseCallback): void => {
  if (nativeXHR != null) return

  onRequestCallback = onRequest
  onResponseCallback = onResponse

  nativeXHR = window.XMLHttpRequest
  Object.defineProperty(window, 'XMLHttpRequest', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: InterceptXMLHttpRequest
  })

  logger.debug('xhr hook activated')
}

export const unregisterInterceptNetworkXHRModule = (): void => {
  if (nativeXHR == null) return

  Object.defineProperty(window, 'XMLHttpRequest', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: nativeXHR
  })
  nativeXHR = null

  onRequestCallback = null
  onResponseCallback = null

  logger.debug('xhr hook deactivated')
}