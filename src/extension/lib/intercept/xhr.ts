import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import Logger from '@ext/lib/logger'

type XHRRequestBody = Document | XMLHttpRequestBodyInit
type XHRResponseBody = string | object | Document | ArrayBuffer

const logger = new Logger('INTERCEPT-XHR')

export default class InterceptXMLHttpRequest<U = unknown> extends XMLHttpRequest {
  /// Public ///

  public static setCallback<U = unknown>(cb?: ((this: InterceptXMLHttpRequest<U>, type: keyof XMLHttpRequestEventMap, evt: ProgressEvent) => void) | null): void {
    this.callback = cb as typeof this.callback ?? null
    if (cb == null) {
      if (this.original == null) return

      window.XMLHttpRequest = this.original
      this.original = null

      logger.debug('xhr hook deactivated')
    } else {
      if (this.original != null) return

      this.original = window.XMLHttpRequest
      window.XMLHttpRequest = this

      logger.debug('xhr hook activated')
    }
  }

  public userData: U | null

  public constructor() {
    super()

    this.userData = null

    this.openMethod = 'GET'
    this.openURL = new URL('/', location.href)
    this.sendBody = null
    this.eventTarget = new InterceptEventTargetAdapter(this)
    this.overrideReadyState = null
    this.overrideStatus = null
    this.overrideResponse = null

    this.eventTarget.addEventListener('abort', this.onEvent.bind(this, 'abort'))
    this.eventTarget.addEventListener('error', this.onEvent.bind(this, 'error'))
    this.eventTarget.addEventListener('load', this.onEvent.bind(this, 'load'))
    this.eventTarget.addEventListener('loadend', this.onEvent.bind(this, 'loadend'))
    this.eventTarget.addEventListener('loadstart', this.onEvent.bind(this, 'loadstart'))
    this.eventTarget.addEventListener('progress', this.onEvent.bind(this, 'progress'))
    this.eventTarget.addEventListener('timeout', this.onEvent.bind(this, 'timeout'))
  }

  // Getter

  public get requestMethod(): string {
    return this.openMethod
  }

  public get requestURL(): URL {
    return this.openURL
  }

  public get requestBody(): XHRRequestBody | null {
    return this.sendBody ?? null
  }

  public get readyState(): number {
    const { overrideReadyState } = this
    if (overrideReadyState == null) return super.readyState

    return overrideReadyState
  }

  public get status(): number {
    const { overrideStatus } = this
    if (overrideStatus == null) return super.status

    return overrideStatus
  }

  public get response(): any {
    logger.debug('xhr get response', this.responseURL ?? this, this.overrideResponse != null)

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
    logger.debug('xhr get response text', this.responseURL ?? this, this.overrideResponse != null)

    const { overrideResponse } = this
    if (overrideResponse == null) return super.responseText

    return new TextDecoder().decode(overrideResponse)
  }

  public get responseXML(): Document {
    logger.debug('xhr get response xml', this.responseURL ?? this, this.overrideResponse != null)

    return new DOMParser().parseFromString(this.responseText, 'text/xml')
  }

  public get onabort(): XMLHttpRequestEventTarget['onabort'] | null {
    return this.eventTarget.getEventListener('onabort')
  }

  public get onerror(): XMLHttpRequestEventTarget['onerror'] | null {
    return this.eventTarget.getEventListener('onerror')
  }

  public get onload(): XMLHttpRequestEventTarget['onload'] | null {
    return this.eventTarget.getEventListener('onload')
  }

  public get onloadend(): XMLHttpRequestEventTarget['onloadend'] | null {
    return this.eventTarget.getEventListener('onloadend')
  }

  public get onloadstart(): XMLHttpRequestEventTarget['onloadstart'] | null {
    return this.eventTarget.getEventListener('onloadstart')
  }

  public get onprogress(): XMLHttpRequestEventTarget['onprogress'] | null {
    return this.eventTarget.getEventListener('onprogress')
  }

  public get ontimeout(): XMLHttpRequestEventTarget['ontimeout'] | null {
    return this.eventTarget.getEventListener('ontimeout')
  }

  // Setter

  public set onabort(listener: XMLHttpRequestEventTarget['onabort']) {
    this.eventTarget.setEventListener('onabort', 'abort', listener)
  }

  public set onerror(listener: XMLHttpRequestEventTarget['onerror']) {
    this.eventTarget.setEventListener('onerror', 'error', listener)
  }

  public set onload(listener: XMLHttpRequestEventTarget['onload']) {
    this.eventTarget.setEventListener('onload', 'load', listener)
  }

  public set onloadend(listener: XMLHttpRequestEventTarget['onloadend']) {
    this.eventTarget.setEventListener('onloadend', 'loadend', listener)
  }

  public set onloadstart(listener: XMLHttpRequestEventTarget['onloadstart']) {
    this.eventTarget.setEventListener('onloadstart', 'loadstart', listener)
  }

  public set onprogress(listener: XMLHttpRequestEventTarget['onprogress']) {
    this.eventTarget.setEventListener('onprogress', 'progress', listener)
  }

  public set ontimeout(listener: XMLHttpRequestEventTarget['ontimeout']) {
    this.eventTarget.setEventListener('ontimeout', 'timeout', listener)
  }

  public setOverrideResponse(response: XHRResponseBody): void {
    this.overrideResponse = InterceptXMLHttpRequest.responseToArrayBuffer(response)
  }

  public async generateResponse(response: XHRResponseBody | PromiseLike<XHRResponseBody>): Promise<void> {
    this.internalAbort()
    this.setOverrideResponse(await Promise.resolve(response))

    this.overrideReadyState = 4
    this.overrideStatus = 200

    this.dispatchEvent(new Event('load'))
    this.dispatchEvent(new Event('loadend'))
    this.dispatchEvent(new Event('readystatechange'))
  }

  public open(method: string, url: string | URL): void {
    if (typeof url === 'string') url = new URL(url, location.href)

    this.openMethod = method.toUpperCase()
    this.openURL = url

    super.open(method, url)
  }

  public send(body?: XHRRequestBody): void {
    this.sendBody = body ?? null

    super.send(body)
  }

  /// Private ///

  private static original: (typeof XMLHttpRequest) | null = null
  private static callback: ((this: InterceptXMLHttpRequest, type: keyof XMLHttpRequestEventMap, evt: ProgressEvent) => void) | null = null

  private static responseToArrayBuffer(response: XHRResponseBody): ArrayBuffer {
    if (typeof response === 'object') {
      if (response instanceof Document) response = response.documentElement.outerHTML
      if (!(response instanceof ArrayBuffer)) response = JSON.stringify(response)
    }
    if (typeof response === 'string') response = new TextEncoder().encode(response).buffer

    return <ArrayBuffer>response
  }

  private openMethod: string
  private openURL: URL
  private sendBody: XHRRequestBody | null
  private readonly eventTarget: InterceptEventTargetAdapter<XMLHttpRequestEventTarget, XMLHttpRequestEventMap>
  private overrideReadyState: number | null
  private overrideStatus: number | null
  private overrideResponse: ArrayBuffer | null

  private onEvent(type: keyof XMLHttpRequestEventMap, evt: ProgressEvent): void {
    InterceptXMLHttpRequest.callback?.call(this, type, evt)
  }

  private internalAbort(): void {
    this.eventTarget.blockEvent('abort')
    this.eventTarget.blockEvent('loadend')
    this.abort()
    this.eventTarget.unblockEvent('abort')
    this.eventTarget.unblockEvent('loadend')
  }
}