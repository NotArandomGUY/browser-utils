import { URL, XMLHttpRequest } from '@ext/global/network'
import { assign, defineProperties, fromEntries, getOwnPropertyDescriptor, keys } from '@ext/global/object'
import { bufferToString } from '@ext/lib/buffer'
import { unsafePolicy } from '@ext/lib/dom'
import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import { NetworkContext, NetworkContextState, NetworkRequestCallback, NetworkResponseCallback, NetworkResponseContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { proxyBind } from '@ext/lib/proxy/bind'

type XHRRequestBody = Document | XMLHttpRequestBodyInit

const logger = new Logger('INTERCEPT-XHR')

const DOM_MIME_TYPES = ['application/xhtml+xml', 'application/xml', 'image/svg+xml', 'text/html', 'text/xml']
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

const parseHeaders = (headers: string): Record<string, string> => {
  return fromEntries(
    headers
      .split('\n')
      .map(line => HEADER_LINE_REGEXP.exec(line)?.slice(1))
      .filter(entry => entry?.length === 2) as [string, string][]
  )
}

const parseDOM = (parser => (string: string, type?: string | null) => {
  type = type?.split(';')[0]?.trim()
  return parser.parseFromString(unsafePolicy.createHTML(string), (DOM_MIME_TYPES.includes(type!) ? type : 'text/xml') as DOMParserSupportedType)
})(new DOMParser())

const responseMimeType = (xhr: InterceptXMLHttpRequest): string | null => {
  return new Headers(parseHeaders(xhr.getAllResponseHeaders())).get('content-type')
}

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
      this.open(request.method, request.url)
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
        headers: parseHeaders(this.getAllResponseHeaders())
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

const NativePrototype = XMLHttpRequest.prototype
const NativePrototypeMap = new Map(([
  'addEventListener',
  'dispatchEvent',
  'removeEventListener'
] satisfies (keyof XMLHttpRequest)[]).map(key => [NativePrototype[key as keyof typeof NativePrototype], key]))

const { addEventListener } = NativePrototype

class InterceptXMLHttpRequest extends XMLHttpRequest {
  /// Public ///

  public ctx: NetworkContext | null
  public requestSync: boolean
  public requestMethod: string
  public requestURL: URL
  public requestHeaders: Record<string, string>
  public requestBody: XHRRequestBody | null

  public constructor() {
    super()

    this.ctx = null

    this.requestSync = true
    this.requestMethod = 'GET'
    this.requestURL = new URL('/', location.origin)
    this.requestHeaders = {}
    this.requestBody = null
    this.overrideReadyState = 0
    this.overrideStatus = null
    this.overrideHeaders = null
    this.overrideResponse = null

    const externalData: Record<string | symbol, unknown> = {}

    addEventListener.call(this, 'readystatechange', handleXHRReadyStateChange.bind(this))
    addEventListener.call(this, 'abort', handleXHRError.bind(this))
    addEventListener.call(this, 'error', handleXHRError.bind(this))
    addEventListener.call(this, 'timeout', handleXHRError.bind(this))
    addEventListener.call(this, 'load', handleXHRLoad.bind(this))
    addEventListener.call(this, 'progress', this.dispatchProgress.bind(this, 'progress'))

    const eventTarget = new InterceptEventTargetAdapter<XMLHttpRequest, XMLHttpRequestEventMap>(new EventTarget())
    this.eventTarget = eventTarget

    return new Proxy(this, { // NOSONAR
      get(target, p) {
        if (p in XHR_EVENT_MAP) {
          // Event listener getter
          return eventTarget.getEventListener(p as keyof typeof XHR_EVENT_MAP)
        } else if (p in NativePrototype) {
          // Only allow access to native properties if exists
          let value = target[p as keyof typeof target]

          // Some polyfill might use different name for native methods, override them too
          const key = NativePrototypeMap.get(value)
          if (p !== key && key != null) value = target[key as keyof typeof target]

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
        } else if (p in NativePrototype) {
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
        return parseDOM(bufferToString(overrideResponse), responseMimeType(this))
      case 'json':
        return JSON.parse(bufferToString(overrideResponse) || 'null')
      case 'text':
      case '':
        return bufferToString(overrideResponse)
      default:
        return null
    }
  }

  public get responseText(): string {
    const { responseType, response } = this

    if (typeof response === 'string') return response

    throw new DOMException(
      `Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was '${responseType}').`,
      'InvalidStateError'
    )
  }

  public get responseXML(): Document {
    const { responseType, response } = this

    if (response instanceof Document) return response
    if (responseType === '' && typeof response === 'string') return parseDOM(response, responseMimeType(this))

    throw new DOMException(
      `Failed to read the 'responseXML' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'document' (was '${responseType}').`,
      'InvalidStateError'
    )
  }

  // Method

  public addEventListener<KM extends keyof XMLHttpRequestEventMap>(type: KM, listener: (evt: XMLHttpRequestEventMap[KM]) => Promise<void> | void, options?: AddEventListenerOptions): void {
    this.eventTarget.addEventListener(type, listener, options)
  }

  public removeEventListener<KM extends keyof XMLHttpRequestEventMap>(type: KM, listener: (evt: XMLHttpRequestEventMap[KM]) => Promise<void> | void): void {
    this.eventTarget.removeEventListener(type, listener)
  }

  public setRequestHeader(name: string, value: string): void {
    this.requestHeaders[name] = value
  }

  public getAllResponseHeaders(): string {
    const { overrideHeaders } = this

    if (overrideHeaders == null) return super.getAllResponseHeaders()

    return overrideHeaders
  }

  public open(method: string, url: string | URL, async = true, username?: string | null, password?: string | null): void {
    if (typeof url === 'string') url = new URL(url, location.origin)

    this.requestSync = !async
    this.requestMethod = method.toUpperCase()
    this.requestURL = url

    super.open(method, url, async, username, password)
  }

  public send(body?: XHRRequestBody): void {
    this.requestBody = body ?? null

    const sendInternal = (isIntercepted: boolean): void => {
      if (isIntercepted) return

      const { requestHeaders, requestBody } = this

      for (const name in requestHeaders) {
        super.setRequestHeader(name, requestHeaders[name])
      }
      super.send(requestBody)
    }

    // Cannot wait for request handler in sync request
    if (this.requestSync) return sendInternal(false)

    handleXHRSend.call(this)
      .then(sendInternal)
      .catch(error => {
        logger.warn('send handler error:', error)
        this.abort()
      })
  }

  public changeReadyState(targetReadyState: number): void {
    const { ctx, requestURL, readyState: currentReadyState } = this

    if (targetReadyState < currentReadyState) return

    logger.trace(`change request '${requestURL.toString()}' ready state ${currentReadyState} -> ${targetReadyState}`)

    if (targetReadyState === currentReadyState) {
      // Only allow multiple ready state change on LOADING
      if (targetReadyState === 3) this.dispatchProgress('readystatechange')
      return
    }

    for (let readyState = currentReadyState + 1; readyState <= targetReadyState; readyState++) {
      this.overrideReadyState = readyState
      this.dispatchProgress('readystatechange')

      // Specific event for ready state
      switch (readyState) {
        case 2:
          this.dispatchProgress('loadstart')
          break
        case 4:
          if (ctx?.state === NetworkState.SUCCESS) {
            this.dispatchProgress('load')
          } else {
            this.dispatchProgress('error')
          }
          this.dispatchProgress('loadend')
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

  public abort(): void {
    logger.trace(`abort request '${this.requestURL.toString()}'`)

    super.abort()
  }

  /// Private ///

  private readonly eventTarget: InterceptEventTargetAdapter<XMLHttpRequestEventTarget, XMLHttpRequestEventMap>
  private overrideReadyState: number
  private overrideStatus: number | null
  private overrideHeaders: string | null
  private overrideResponse: ArrayBuffer | null

  private dispatchProgress(type: Extract<keyof XMLHttpRequestEventMap, string>, init?: ProgressEventInit): void {
    this.eventTarget.dispatchEvent(type, new ProgressEvent(type, init), this)
  }
}

const HookPrototype = InterceptXMLHttpRequest.prototype

defineProperties(HookPrototype, fromEntries([...keys(NativePrototype), ...NativePrototypeMap.values()].map(key => {
  const descriptor = getOwnPropertyDescriptor(HookPrototype, key)
  if (descriptor == null) return null

  const { writable, value, get, set } = descriptor
  return [key, {
    ...(getOwnPropertyDescriptor(NativePrototype, key) ?? { configurable: true, enumerable: true }),
    ...((get != null || set != null) ? { get, set } : { writable, value })
  }]
}).filter(e => e != null)))
defineProperties(InterceptXMLHttpRequest, fromEntries(keys(XMLHttpRequest).map(key => {
  return [key, {
    ...(getOwnPropertyDescriptor(XMLHttpRequest, key) ?? { configurable: true, enumerable: true }),
    value: InterceptXMLHttpRequest[key as keyof typeof InterceptXMLHttpRequest]
  }]
}).filter(e => e != null)))

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