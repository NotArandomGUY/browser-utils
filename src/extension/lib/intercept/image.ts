import { defineProperty } from '@ext/global/object'
import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import Logger from '@ext/lib/logger'

type HTMLMediaElementEventMap = HTMLElementEventMap & { 'srcchange': CustomEvent<string> }

const logger = new Logger('INTERCEPT-IMAGE')

const IMAGE_EVENTS = [
  'abort',
  'animationcancel',
  'animationend',
  'animationiteration',
  'animationstart',
  'auxclick',
  'beforeinput',
  'blur',
  'cancel',
  'canplay',
  'canplaythrough',
  'change',
  'click',
  'close',
  'contextmenu',
  'copy',
  'cuechange',
  'cut',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'durationchange',
  'emptied',
  'ended',
  'error',
  'focus',
  'formdata',
  'gotpointercapture',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'lostpointercapture',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'pause',
  'play',
  'playing',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'progress',
  'ratechange',
  'reset',
  'resize',
  'scroll',
  'scrollend',
  'securitypolicyviolation',
  'seeked',
  'seeking',
  'select',
  'selectionchange',
  'selectstart',
  'slotchange',
  'stalled',
  'submit',
  'suspend',
  'timeupdate',
  'toggle',
  'touchcancel',
  'touchend',
  'touchmove',
  'touchstart',
  'transitioncancel',
  'transitionend',
  'transitionrun',
  'transitionstart',
  'volumechange',
  'waiting',
  'webkitanimationend',
  'webkitanimationiteration',
  'webkitanimationstart',
  'webkittransitionend',
  'wheel'
] as const

export default class InterceptImage extends Image {
  /// Public ///

  public static setCallback(cb?: ((this: InterceptImage, type: keyof HTMLMediaElementEventMap, evt: Event) => void) | null): void {
    InterceptImage.callback = cb ?? null

    if (cb == null) {
      if (this.original == null) return

      window.Image = this.original
      this.original = null

      logger.debug('image hook deactivated')
    } else {
      if (this.original != null) return

      this.original = window.Image
      window.Image = this

      logger.debug('image hook activated')
    }
  }

  public constructor(width?: number, height?: number) {
    super(width, height)

    this.eventTarget = new InterceptEventTargetAdapter(this)

    const { eventTarget, onEvent, onSrcChange } = this

    for (const event of IMAGE_EVENTS) {
      eventTarget.addEventListener(event, onEvent.bind(this, event))

      const prop = `on${event}` as const
      defineProperty(this, prop, {
        get() {
          return eventTarget.getEventListener(prop)
        },
        set(listener) {
          eventTarget.setEventListener(prop, event, listener)
        }
      })
    }

    eventTarget.addEventListener('srcchange', onEvent.bind(this, 'srcchange'))
    eventTarget.addEventListener('srcchange', onSrcChange.bind(this))
  }

  public get src(): string {
    return this.overrideSrc ?? super.src
  }

  public set src(src: string) {
    this.overrideSrc = src
    this.eventTarget.dispatchEvent('srcchange', new CustomEvent('srcchange', { cancelable: true, detail: src }))
  }

  /// Private ///

  private static original: (typeof Image) | null = null
  private static callback: ((this: InterceptImage, type: keyof HTMLMediaElementEventMap, evt: Event) => void) | null = null

  private readonly eventTarget: InterceptEventTargetAdapter<GlobalEventHandlers, HTMLMediaElementEventMap>
  private overrideSrc: string | null = null

  private onEvent(type: keyof HTMLMediaElementEventMap, evt: Event): void {
    InterceptImage.callback?.call(this, type, evt)
  }

  private onSrcChange(evt: CustomEvent<string>): void {
    super.src = evt.detail
    this.overrideSrc = null
  }
}