import { URL, XMLHttpRequest } from '@ext/global/network'
import { assign, defineProperties, defineProperty, fromEntries, getOwnPropertyDescriptor, keys } from '@ext/global/object'
import { waitTick } from '@ext/lib/async'
import { bufferToString } from '@ext/lib/buffer'
import { unsafePolicy } from '@ext/lib/dom'
import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import { NetworkContext, NetworkContextState, NetworkRequestCallback, NetworkResponseCallback, NetworkResponseContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import { proxyBind } from '@ext/lib/proxy/bind'

const logger = new Logger('INTERCEPT-XHR')

type XHRRequestBody = Document | XMLHttpRequestBodyInit

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
const EVENT_TARGET_ALIAS = [
  ['dispatchEvent'],
  ['addEventListener', '__zone_symbol__addEventListener'],
  ['removeEventListener', '__zone_symbol__removeEventListener']
] satisfies [keyof XMLHttpRequest, ...string[]][]

let nativeXHR: (typeof XMLHttpRequest) | null = null
let onRequestCallback: NetworkRequestCallback | null = null
let onResponseCallback: NetworkResponseCallback | null = null
let nextRequestId = 0

const parseUrl = (url: string): URL => {
  return new URL(url, document.querySelector('base')?.href ?? location.href)
}

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

const responseTypeError = (prop: string, expectType: string, actualType: string): DOMException => {
  return new DOMException(
    `Failed to read the '${prop}' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or '${expectType}' (was '${actualType}').`,
    'InvalidStateError'
  )
}

const responseMimeType = (xhr: InterceptXMLHttpRequest): string | null => {
  return xhr.getResponseHeader('content-type')
}

const responseBlob = (status: number, responseType: XMLHttpRequestResponseType, response: unknown): Blob | null => {
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

const NativePrototype = XMLHttpRequest.prototype
const EventTargetPrototype = XMLHttpRequestEventTarget.prototype

const { addEventListener, removeEventListener } = EventTargetPrototype

// Instance Properties
const kiEventTarget = Symbol()
const kiContext = Symbol()
const kiReadyState = Symbol()
const kiRequestId = Symbol()
const kiRequestSync = Symbol()
const kiRequestMethod = Symbol()
const kiRequestURL = Symbol()
const kiRequestHeaders = Symbol()
const kiRequestBody = Symbol()
const kiResponseStatus = Symbol()
const kiResponseHeaders = Symbol()
const kiResponseBody = Symbol()
const kiResponseObject = Symbol()

// Instance Methods
const kmCacheResponseObject = Symbol()
const kmDispatchProgress = Symbol()
const kmChangeReadyState = Symbol()
const kmCompleteRequest = Symbol()
const kmHandleXHRReadyStateChange = Symbol()
const kmHandleXHRSend = Symbol()
const kmHandleXHRLoad = Symbol()
const kmHandleXHRError = Symbol()

class InterceptXMLHttpRequest extends XMLHttpRequest {
  /// Public ///

  public constructor() {
    super()

    const listen = <A extends unknown[]>(type: string, listener: (...args: [...A, Event]) => void, ...args: A): void => {
      addEventListener.call(this, type, listener.bind(this, ...args))
    }
    listen('readystatechange', this[kmHandleXHRReadyStateChange])
    listen('abort', this[kmHandleXHRError])
    listen('error', this[kmHandleXHRError])
    listen('timeout', this[kmHandleXHRError])
    listen('load', this[kmHandleXHRLoad])
    listen('progress', this[kmDispatchProgress], 'progress')

    const eventTarget = new InterceptEventTargetAdapter<XMLHttpRequest, XMLHttpRequestEventMap>(this, false)
    const externalData: Record<string | symbol, unknown> = {}

    this[kiEventTarget] = eventTarget
    this[kiRequestMethod] = 'GET'
    this[kiRequestURL] = parseUrl('/')

    return new Proxy(this, { // NOSONAR
      get(target, p) {
        if (p in XHR_EVENT_MAP) {
          // Event listener getter
          return eventTarget.getEventListener(p as keyof typeof XHR_EVENT_MAP)
        } else if (p in NativePrototype) {
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
    return this[kiReadyState]
  }

  public get status(): number {
    return this[kiResponseStatus] ?? super.status
  }

  public get response(): any {
    return this[kmCacheResponseObject](() => {
      const { [kiResponseBody]: body } = this

      if (body == null) return super.response

      switch (super.responseType) {
        case 'arraybuffer':
          return body
        case 'blob':
          return new Blob([body])
        case 'document':
          return parseDOM(bufferToString(body), responseMimeType(this))
        case 'json':
          return JSON.parse(bufferToString(body) || 'null')
        case 'text':
        case '':
          return bufferToString(body)
        default:
          return null
      }
    })
  }

  public get responseText(): string {
    const { responseType, response } = this

    if (typeof response === 'string') return response

    throw responseTypeError('responseText', 'text', responseType)
  }

  public get responseXML(): Document | null {
    return this[kmCacheResponseObject]<Document | null>(() => {
      const { responseType, response } = this

      if (response instanceof Document) return response
      if (response === '') return null
      if (responseType === '' && typeof response === 'string') return parseDOM(response, responseMimeType(this))

      throw responseTypeError('responseXML', 'document', responseType)
    })
  }

  // Method

  public addEventListener<KM extends keyof XMLHttpRequestEventMap>(type: KM, listener: (evt: XMLHttpRequestEventMap[KM]) => Promise<void> | void, options?: AddEventListenerOptions): void {
    const eventTarget = this[kiEventTarget]
    if (eventTarget == null) {
      addEventListener.call(this, type, listener as EventListener, options)
    } else {
      eventTarget.addEventListener(type, listener, options)
    }
  }

  public removeEventListener<KM extends keyof XMLHttpRequestEventMap>(type: KM, listener: (evt: XMLHttpRequestEventMap[KM]) => Promise<void> | void): void {
    const eventTarget = this[kiEventTarget]
    if (eventTarget == null) {
      removeEventListener.call(this, type, listener as EventListener)
    } else {
      eventTarget.removeEventListener(type, listener)
    }
  }

  public setRequestHeader(name: string, value: string): void {
    this[kiRequestHeaders].set(name, value)
  }

  public getAllResponseHeaders(): string {
    const { [kiReadyState]: readyState, [kiResponseHeaders]: headers } = this

    return readyState >= 2 ? (headers ?? super.getAllResponseHeaders()) : ''
  }

  public getResponseHeader(name: string): string | null {
    try {
      return new Headers(parseHeaders(this.getAllResponseHeaders())).get(name)
    } catch {
      return null
    }
  }

  public open(method: string, url: string | URL, async = true, username?: string | null, password?: string | null): void {
    if (typeof url === 'string') url = parseUrl(url)

    logger.trace(`open ${method} request '${url.toString()}'`)

    this[kiRequestHeaders].clear()
    assign(this, {
      [kiRequestId]: nextRequestId++,
      [kiRequestSync]: !async,
      [kiRequestMethod]: method.toUpperCase(),
      [kiRequestURL]: url,
      [kiRequestBody]: null,
      [kiResponseStatus]: null,
      [kiResponseHeaders]: null,
      [kiResponseBody]: null,
      [kiResponseObject]: null
    })

    this[kmChangeReadyState](1)
    this[kiReadyState] = 1

    super.open(method, url, async, username, password)
  }

  public send(body?: XHRRequestBody): void {
    this[kiRequestBody] = body ?? null

    const sendInternal = (isIntercepted: boolean): void => {
      if (isIntercepted) return

      const { [kiRequestHeaders]: headers, [kiRequestBody]: body } = this

      for (const [name, value] of headers) {
        super.setRequestHeader(name, value)
      }
      super.send(body)
    }

    // Cannot wait for request handler in sync request
    if (this[kiRequestSync]) return sendInternal(false)

    this[kmHandleXHRSend]()
      .then(sendInternal)
      .catch(error => {
        logger.warn('send handler error:', error)
        this.abort()
      })
  }

  public abort(): void {
    logger.trace(`abort request '${this[kiRequestURL].toString()}'`)

    super.abort()

    this[kiReadyState] = 0
  }

  /// Private ///

  private [kiEventTarget]: InterceptEventTargetAdapter<XMLHttpRequest, XMLHttpRequestEventMap>
  private [kiContext]: NetworkContext | null = null
  private [kiReadyState]: number = 0
  private [kiRequestId]: number = -1
  private [kiRequestSync]: boolean = true
  private [kiRequestMethod]: string
  private [kiRequestURL]: URL
  private [kiRequestHeaders]: Map<string, string> = new Map()
  private [kiRequestBody]: XHRRequestBody | null = null
  private [kiResponseStatus]: number | null = null
  private [kiResponseHeaders]: string | null = null
  private [kiResponseBody]: ArrayBuffer | null = null
  private [kiResponseObject]: object | null = null

  private [kmCacheResponseObject]<T extends object | null>(callback: () => T): T {
    let object = this[kiResponseObject]
    if (object != null) return object as T

    object = callback()
    if (this[kiReadyState] > 3) this[kiResponseObject] = object

    return object as T
  }

  private [kmDispatchProgress](type: Extract<keyof XMLHttpRequestEventMap, string>, init?: ProgressEventInit): void {
    this.dispatchEvent(new ProgressEvent(type, init))
  }

  private [kmChangeReadyState](targetReadyState: number): void {
    const { [kiContext]: ctx, [kiRequestURL]: url, [kiReadyState]: currentReadyState } = this

    if (targetReadyState < currentReadyState) return

    logger.trace(`change request '${url.toString()}' ready state ${currentReadyState} -> ${targetReadyState}`)

    if (targetReadyState === currentReadyState) {
      // Only allow multiple ready state change on LOADING
      if (targetReadyState === 3) this[kmDispatchProgress]('readystatechange')
      return
    }

    for (let readyState = currentReadyState + 1; readyState <= targetReadyState; readyState++) {
      this[kiReadyState] = readyState
      this[kmDispatchProgress]('readystatechange')

      // Specific event for ready state
      switch (readyState) {
        case 2:
          this[kmDispatchProgress]('loadstart')
          break
        case 4: {
          const isLoad = ctx == null ? (super.status > 0) : (ctx.state === NetworkState.SUCCESS)
          this[kmDispatchProgress](isLoad ? 'load' : 'error')
          this[kmDispatchProgress]('loadend')
          break
        }
      }
    }
  }

  private async [kmCompleteRequest](): Promise<void> {
    const { [kiContext]: ctx } = this

    // Sync ready state
    if (ctx == null) {
      this[kmChangeReadyState](super.readyState)
      return
    }

    if (super.readyState < 4) {
      // Change ready state to LOADING
      this[kmChangeReadyState](3)

      // Abort ongoing request
      this.abort()
    }

    // Set override status & response
    switch (ctx.state) {
      case NetworkState.SUCCESS: {
        const { response } = ctx

        this[kiResponseStatus] = response.status
        this[kiResponseHeaders] = [...Array.from(response.headers.entries()).map(e => `${e[0]}: ${e[1]}`), ''].join('\r\n')
        this[kiResponseBody] = await response.arrayBuffer()
        this[kiResponseObject] = null
        break
      }
      case NetworkState.FAILED:
        this[kiResponseStatus] = 0
        break
    }

    // Change ready state to DONE
    this[kmChangeReadyState](4)
  }

  private [kmHandleXHRReadyStateChange](): void {
    const readyState = super.readyState
    if (readyState < 4) this[kmChangeReadyState](readyState)
  }

  private async [kmHandleXHRSend](): Promise<boolean> {
    if (onRequestCallback == null) return false

    const { [kiRequestId]: requestId, [kiRequestMethod]: method, [kiRequestURL]: url, [kiRequestHeaders]: headers, [kiRequestBody]: body } = this

    const init: RequestInit = { method, headers: Array.from(headers.entries()) }
    switch (method.toUpperCase()) {
      case 'GET':
      case 'HEAD':
        break
      default:
        init.body = body instanceof Document ? new XMLSerializer().serializeToString(body) : body
        break
    }

    const ctx = await onRequestCallback(url, init)
    this[kiContext] = ctx

    // Abort if no longer handling the same request
    if (this[kiRequestId] !== requestId) return true

    // Invoke respective handler if response is set
    switch (ctx.state) {
      case NetworkState.SUCCESS:
        await this[kmHandleXHRLoad]()
        break
      case NetworkState.FAILED:
        await this[kmHandleXHRError]()
        break
      default: {
        const request = ctx.request.clone()
        this.open(request.method, request.url)
        this[kiRequestHeaders] = new Map(request.headers.entries())
        this[kiRequestBody] = await request.blob()
        return false
      }
    }

    return true
  }

  private async [kmHandleXHRLoad](): Promise<void> {
    // Complete sync request
    if (this[kiRequestSync]) return this[kmCompleteRequest]()

    const ctx = this[kiContext]
    if (ctx == null || ctx.passthrough || onResponseCallback == null) return

    // Create response context
    if (ctx.state === NetworkState.UNSENT) {
      const getResponsePart = (pos: number) => responseBlob(super.status, super.responseType, super.response)?.slice(pos)
      const getReadyState = () => super.readyState
      assign<NetworkContext, NetworkContextState>(ctx, {
        state: NetworkState.SUCCESS,
        response: new Response(
          new ReadableStream({
            async start(controller) {
              try {
                for (let pos = 0, part: Blob | undefined; ; pos += part.size) {
                  part = getResponsePart(pos)
                  if (part == null || (part.size === 0 && getReadyState() > 3)) break

                  controller.enqueue(new Uint8Array(await part.arrayBuffer()))
                  await waitTick()
                }
                controller.close()
              } catch (error) {
                controller.error(error)
              }
            }
          }),
          { status: this.status, headers: parseHeaders(this.getAllResponseHeaders()) }
        )
      })
    }

    await onResponseCallback(ctx as NetworkResponseContext)
    ctx.passthrough = true

    // Complete request
    await this[kmCompleteRequest]()
  }

  private async [kmHandleXHRError](): Promise<void> {
    // Complete sync request
    if (this[kiRequestSync]) return this[kmCompleteRequest]()

    const ctx = this[kiContext]
    if (ctx == null || ctx.passthrough || onResponseCallback == null) return

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
    await this[kmCompleteRequest]()
  }
}

const HookPrototype = InterceptXMLHttpRequest.prototype

defineProperties(HookPrototype, fromEntries(keys(NativePrototype).map(key => {
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
  defineProperty(window, 'XMLHttpRequest', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: InterceptXMLHttpRequest
  })

  defineProperties(EventTargetPrototype, fromEntries(EVENT_TARGET_ALIAS.flatMap(keys => keys.map((alias, i) => [alias, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: i > 0 ? undefined : HookPrototype[alias as keyof typeof HookPrototype] ?? EventTargetPrototype[alias as keyof typeof EventTargetPrototype]
  }]))))
  for (const [key] of EVENT_TARGET_ALIAS) delete HookPrototype[key]

  logger.debug('xhr hook activated')
}

export const unregisterInterceptNetworkXHRModule = (): void => {
  if (nativeXHR == null) return

  defineProperty(window, 'XMLHttpRequest', {
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