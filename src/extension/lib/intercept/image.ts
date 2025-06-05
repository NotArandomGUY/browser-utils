import InterceptEventTargetAdapter from '@ext/lib/intercept/event'
import Logger from '@ext/lib/logger'

type HTMLMediaElementEventMap = HTMLElementEventMap & { 'srcchange': CustomEvent<string> }

const logger = new Logger('INTERCEPT-IMAGE')

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

    this.eventTarget.addEventListener('abort', this.onEvent.bind(this, 'abort'))
    this.eventTarget.addEventListener('animationcancel', this.onEvent.bind(this, 'animationcancel'))
    this.eventTarget.addEventListener('animationend', this.onEvent.bind(this, 'animationend'))
    this.eventTarget.addEventListener('animationiteration', this.onEvent.bind(this, 'animationiteration'))
    this.eventTarget.addEventListener('animationstart', this.onEvent.bind(this, 'animationstart'))
    this.eventTarget.addEventListener('auxclick', this.onEvent.bind(this, 'auxclick'))
    this.eventTarget.addEventListener('beforeinput', this.onEvent.bind(this, 'beforeinput'))
    this.eventTarget.addEventListener('blur', this.onEvent.bind(this, 'blur'))
    this.eventTarget.addEventListener('cancel', this.onEvent.bind(this, 'cancel'))
    this.eventTarget.addEventListener('canplay', this.onEvent.bind(this, 'canplay'))
    this.eventTarget.addEventListener('canplaythrough', this.onEvent.bind(this, 'canplaythrough'))
    this.eventTarget.addEventListener('change', this.onEvent.bind(this, 'change'))
    this.eventTarget.addEventListener('click', this.onEvent.bind(this, 'click'))
    this.eventTarget.addEventListener('close', this.onEvent.bind(this, 'close'))
    this.eventTarget.addEventListener('contextmenu', this.onEvent.bind(this, 'contextmenu'))
    this.eventTarget.addEventListener('copy', this.onEvent.bind(this, 'copy'))
    this.eventTarget.addEventListener('cuechange', this.onEvent.bind(this, 'cuechange'))
    this.eventTarget.addEventListener('cut', this.onEvent.bind(this, 'cut'))
    this.eventTarget.addEventListener('dblclick', this.onEvent.bind(this, 'dblclick'))
    this.eventTarget.addEventListener('drag', this.onEvent.bind(this, 'drag'))
    this.eventTarget.addEventListener('dragend', this.onEvent.bind(this, 'dragend'))
    this.eventTarget.addEventListener('dragenter', this.onEvent.bind(this, 'dragenter'))
    this.eventTarget.addEventListener('dragleave', this.onEvent.bind(this, 'dragleave'))
    this.eventTarget.addEventListener('dragover', this.onEvent.bind(this, 'dragover'))
    this.eventTarget.addEventListener('dragstart', this.onEvent.bind(this, 'dragstart'))
    this.eventTarget.addEventListener('drop', this.onEvent.bind(this, 'drop'))
    this.eventTarget.addEventListener('durationchange', this.onEvent.bind(this, 'durationchange'))
    this.eventTarget.addEventListener('emptied', this.onEvent.bind(this, 'emptied'))
    this.eventTarget.addEventListener('ended', this.onEvent.bind(this, 'ended'))
    this.eventTarget.addEventListener('error', this.onEvent.bind(this, 'error'))
    this.eventTarget.addEventListener('focus', this.onEvent.bind(this, 'focus'))
    this.eventTarget.addEventListener('formdata', this.onEvent.bind(this, 'formdata'))
    this.eventTarget.addEventListener('gotpointercapture', this.onEvent.bind(this, 'gotpointercapture'))
    this.eventTarget.addEventListener('input', this.onEvent.bind(this, 'input'))
    this.eventTarget.addEventListener('invalid', this.onEvent.bind(this, 'invalid'))
    this.eventTarget.addEventListener('keydown', this.onEvent.bind(this, 'keydown'))
    this.eventTarget.addEventListener('keypress', this.onEvent.bind(this, 'keypress'))
    this.eventTarget.addEventListener('keyup', this.onEvent.bind(this, 'keyup'))
    this.eventTarget.addEventListener('load', this.onEvent.bind(this, 'load'))
    this.eventTarget.addEventListener('loadeddata', this.onEvent.bind(this, 'loadeddata'))
    this.eventTarget.addEventListener('loadedmetadata', this.onEvent.bind(this, 'loadedmetadata'))
    this.eventTarget.addEventListener('loadstart', this.onEvent.bind(this, 'loadstart'))
    this.eventTarget.addEventListener('lostpointercapture', this.onEvent.bind(this, 'lostpointercapture'))
    this.eventTarget.addEventListener('mousedown', this.onEvent.bind(this, 'mousedown'))
    this.eventTarget.addEventListener('mouseenter', this.onEvent.bind(this, 'mouseenter'))
    this.eventTarget.addEventListener('mouseleave', this.onEvent.bind(this, 'mouseleave'))
    this.eventTarget.addEventListener('mousemove', this.onEvent.bind(this, 'mousemove'))
    this.eventTarget.addEventListener('mouseout', this.onEvent.bind(this, 'mouseout'))
    this.eventTarget.addEventListener('mouseover', this.onEvent.bind(this, 'mouseover'))
    this.eventTarget.addEventListener('mouseup', this.onEvent.bind(this, 'mouseup'))
    this.eventTarget.addEventListener('paste', this.onEvent.bind(this, 'paste'))
    this.eventTarget.addEventListener('pause', this.onEvent.bind(this, 'pause'))
    this.eventTarget.addEventListener('play', this.onEvent.bind(this, 'play'))
    this.eventTarget.addEventListener('playing', this.onEvent.bind(this, 'playing'))
    this.eventTarget.addEventListener('pointercancel', this.onEvent.bind(this, 'pointercancel'))
    this.eventTarget.addEventListener('pointerdown', this.onEvent.bind(this, 'pointerdown'))
    this.eventTarget.addEventListener('pointerenter', this.onEvent.bind(this, 'pointerenter'))
    this.eventTarget.addEventListener('pointerleave', this.onEvent.bind(this, 'pointerleave'))
    this.eventTarget.addEventListener('pointermove', this.onEvent.bind(this, 'pointermove'))
    this.eventTarget.addEventListener('pointerout', this.onEvent.bind(this, 'pointerout'))
    this.eventTarget.addEventListener('pointerover', this.onEvent.bind(this, 'pointerover'))
    this.eventTarget.addEventListener('pointerup', this.onEvent.bind(this, 'pointerup'))
    this.eventTarget.addEventListener('progress', this.onEvent.bind(this, 'progress'))
    this.eventTarget.addEventListener('ratechange', this.onEvent.bind(this, 'ratechange'))
    this.eventTarget.addEventListener('reset', this.onEvent.bind(this, 'reset'))
    this.eventTarget.addEventListener('resize', this.onEvent.bind(this, 'resize'))
    this.eventTarget.addEventListener('scroll', this.onEvent.bind(this, 'scroll'))
    this.eventTarget.addEventListener('scrollend', this.onEvent.bind(this, 'scrollend'))
    this.eventTarget.addEventListener('securitypolicyviolation', this.onEvent.bind(this, 'securitypolicyviolation'))
    this.eventTarget.addEventListener('seeked', this.onEvent.bind(this, 'seeked'))
    this.eventTarget.addEventListener('seeking', this.onEvent.bind(this, 'seeking'))
    this.eventTarget.addEventListener('select', this.onEvent.bind(this, 'select'))
    this.eventTarget.addEventListener('selectionchange', this.onEvent.bind(this, 'selectionchange'))
    this.eventTarget.addEventListener('selectstart', this.onEvent.bind(this, 'selectstart'))
    this.eventTarget.addEventListener('slotchange', this.onEvent.bind(this, 'slotchange'))
    this.eventTarget.addEventListener('stalled', this.onEvent.bind(this, 'stalled'))
    this.eventTarget.addEventListener('submit', this.onEvent.bind(this, 'submit'))
    this.eventTarget.addEventListener('suspend', this.onEvent.bind(this, 'suspend'))
    this.eventTarget.addEventListener('timeupdate', this.onEvent.bind(this, 'timeupdate'))
    this.eventTarget.addEventListener('toggle', this.onEvent.bind(this, 'toggle'))
    this.eventTarget.addEventListener('touchcancel', this.onEvent.bind(this, 'touchcancel'))
    this.eventTarget.addEventListener('touchend', this.onEvent.bind(this, 'touchend'))
    this.eventTarget.addEventListener('touchmove', this.onEvent.bind(this, 'touchmove'))
    this.eventTarget.addEventListener('touchstart', this.onEvent.bind(this, 'touchstart'))
    this.eventTarget.addEventListener('transitioncancel', this.onEvent.bind(this, 'transitioncancel'))
    this.eventTarget.addEventListener('transitionend', this.onEvent.bind(this, 'transitionend'))
    this.eventTarget.addEventListener('transitionrun', this.onEvent.bind(this, 'transitionrun'))
    this.eventTarget.addEventListener('transitionstart', this.onEvent.bind(this, 'transitionstart'))
    this.eventTarget.addEventListener('volumechange', this.onEvent.bind(this, 'volumechange'))
    this.eventTarget.addEventListener('waiting', this.onEvent.bind(this, 'waiting'))
    this.eventTarget.addEventListener('webkitanimationend', this.onEvent.bind(this, 'webkitanimationend'))
    this.eventTarget.addEventListener('webkitanimationiteration', this.onEvent.bind(this, 'webkitanimationiteration'))
    this.eventTarget.addEventListener('webkitanimationstart', this.onEvent.bind(this, 'webkitanimationstart'))
    this.eventTarget.addEventListener('webkittransitionend', this.onEvent.bind(this, 'webkittransitionend'))
    this.eventTarget.addEventListener('wheel', this.onEvent.bind(this, 'wheel'))
    this.eventTarget.addEventListener('srcchange', this.onEvent.bind(this, 'srcchange'))

    this.eventTarget.addEventListener('srcchange', this.onSrcChange.bind(this))
  }

  // Getter

  public get onabort(): GlobalEventHandlers['onabort'] | null {
    return this.eventTarget.getEventListener('onabort')
  }

  public get onanimationcancel(): GlobalEventHandlers['onanimationcancel'] | null {
    return this.eventTarget.getEventListener('onanimationcancel')
  }

  public get onanimationend(): GlobalEventHandlers['onanimationend'] | null {
    return this.eventTarget.getEventListener('onanimationend')
  }

  public get onanimationiteration(): GlobalEventHandlers['onanimationiteration'] | null {
    return this.eventTarget.getEventListener('onanimationiteration')
  }

  public get onanimationstart(): GlobalEventHandlers['onanimationstart'] | null {
    return this.eventTarget.getEventListener('onanimationstart')
  }

  public get onauxclick(): GlobalEventHandlers['onauxclick'] | null {
    return this.eventTarget.getEventListener('onauxclick')
  }

  public get onbeforeinput(): GlobalEventHandlers['onbeforeinput'] | null {
    return this.eventTarget.getEventListener('onbeforeinput')
  }

  public get onblur(): GlobalEventHandlers['onblur'] | null {
    return this.eventTarget.getEventListener('onblur')
  }

  public get oncancel(): GlobalEventHandlers['oncancel'] | null {
    return this.eventTarget.getEventListener('oncancel')
  }

  public get oncanplay(): GlobalEventHandlers['oncanplay'] | null {
    return this.eventTarget.getEventListener('oncanplay')
  }

  public get oncanplaythrough(): GlobalEventHandlers['oncanplaythrough'] | null {
    return this.eventTarget.getEventListener('oncanplaythrough')
  }

  public get onchange(): GlobalEventHandlers['onchange'] | null {
    return this.eventTarget.getEventListener('onchange')
  }

  public get onclick(): GlobalEventHandlers['onclick'] | null {
    return this.eventTarget.getEventListener('onclick')
  }

  public get onclose(): GlobalEventHandlers['onclose'] | null {
    return this.eventTarget.getEventListener('onclose')
  }

  public get oncontextmenu(): GlobalEventHandlers['oncontextmenu'] | null {
    return this.eventTarget.getEventListener('oncontextmenu')
  }

  public get oncopy(): GlobalEventHandlers['oncopy'] | null {
    return this.eventTarget.getEventListener('oncopy')
  }

  public get oncuechange(): GlobalEventHandlers['oncuechange'] | null {
    return this.eventTarget.getEventListener('oncuechange')
  }

  public get oncut(): GlobalEventHandlers['oncut'] | null {
    return this.eventTarget.getEventListener('oncut')
  }

  public get ondblclick(): GlobalEventHandlers['ondblclick'] | null {
    return this.eventTarget.getEventListener('ondblclick')
  }

  public get ondrag(): GlobalEventHandlers['ondrag'] | null {
    return this.eventTarget.getEventListener('ondrag')
  }

  public get ondragend(): GlobalEventHandlers['ondragend'] | null {
    return this.eventTarget.getEventListener('ondragend')
  }

  public get ondragenter(): GlobalEventHandlers['ondragenter'] | null {
    return this.eventTarget.getEventListener('ondragenter')
  }

  public get ondragleave(): GlobalEventHandlers['ondragleave'] | null {
    return this.eventTarget.getEventListener('ondragleave')
  }

  public get ondragover(): GlobalEventHandlers['ondragover'] | null {
    return this.eventTarget.getEventListener('ondragover')
  }

  public get ondragstart(): GlobalEventHandlers['ondragstart'] | null {
    return this.eventTarget.getEventListener('ondragstart')
  }

  public get ondrop(): GlobalEventHandlers['ondrop'] | null {
    return this.eventTarget.getEventListener('ondrop')
  }

  public get ondurationchange(): GlobalEventHandlers['ondurationchange'] | null {
    return this.eventTarget.getEventListener('ondurationchange')
  }

  public get onemptied(): GlobalEventHandlers['onemptied'] | null {
    return this.eventTarget.getEventListener('onemptied')
  }

  public get onended(): GlobalEventHandlers['onended'] | null {
    return this.eventTarget.getEventListener('onended')
  }

  public get onerror(): GlobalEventHandlers['onerror'] | null {
    return this.eventTarget.getEventListener('onerror')
  }

  public get onfocus(): GlobalEventHandlers['onfocus'] | null {
    return this.eventTarget.getEventListener('onfocus')
  }

  public get onformdata(): GlobalEventHandlers['onformdata'] | null {
    return this.eventTarget.getEventListener('onformdata')
  }

  public get ongotpointercapture(): GlobalEventHandlers['ongotpointercapture'] | null {
    return this.eventTarget.getEventListener('ongotpointercapture')
  }

  public get oninput(): GlobalEventHandlers['oninput'] | null {
    return this.eventTarget.getEventListener('oninput')
  }

  public get oninvalid(): GlobalEventHandlers['oninvalid'] | null {
    return this.eventTarget.getEventListener('oninvalid')
  }

  public get onkeydown(): GlobalEventHandlers['onkeydown'] | null {
    return this.eventTarget.getEventListener('onkeydown')
  }

  public get onkeypress(): GlobalEventHandlers['onkeypress'] | null { // NOSONAR
    return this.eventTarget.getEventListener('onkeypress')
  }

  public get onkeyup(): GlobalEventHandlers['onkeyup'] | null {
    return this.eventTarget.getEventListener('onkeyup')
  }

  public get onload(): GlobalEventHandlers['onload'] | null {
    return this.eventTarget.getEventListener('onload')
  }

  public get onloadeddata(): GlobalEventHandlers['onloadeddata'] | null {
    return this.eventTarget.getEventListener('onloadeddata')
  }

  public get onloadedmetadata(): GlobalEventHandlers['onloadedmetadata'] | null {
    return this.eventTarget.getEventListener('onloadedmetadata')
  }

  public get onloadstart(): GlobalEventHandlers['onloadstart'] | null {
    return this.eventTarget.getEventListener('onloadstart')
  }

  public get onlostpointercapture(): GlobalEventHandlers['onlostpointercapture'] | null {
    return this.eventTarget.getEventListener('onlostpointercapture')
  }

  public get onmousedown(): GlobalEventHandlers['onmousedown'] | null {
    return this.eventTarget.getEventListener('onmousedown')
  }

  public get onmouseenter(): GlobalEventHandlers['onmouseenter'] | null {
    return this.eventTarget.getEventListener('onmouseenter')
  }

  public get onmouseleave(): GlobalEventHandlers['onmouseleave'] | null {
    return this.eventTarget.getEventListener('onmouseleave')
  }

  public get onmousemove(): GlobalEventHandlers['onmousemove'] | null {
    return this.eventTarget.getEventListener('onmousemove')
  }

  public get onmouseout(): GlobalEventHandlers['onmouseout'] | null {
    return this.eventTarget.getEventListener('onmouseout')
  }

  public get onmouseover(): GlobalEventHandlers['onmouseover'] | null {
    return this.eventTarget.getEventListener('onmouseover')
  }

  public get onmouseup(): GlobalEventHandlers['onmouseup'] | null {
    return this.eventTarget.getEventListener('onmouseup')
  }

  public get onpaste(): GlobalEventHandlers['onpaste'] | null {
    return this.eventTarget.getEventListener('onpaste')
  }

  public get onpause(): GlobalEventHandlers['onpause'] | null {
    return this.eventTarget.getEventListener('onpause')
  }

  public get onplay(): GlobalEventHandlers['onplay'] | null {
    return this.eventTarget.getEventListener('onplay')
  }

  public get onplaying(): GlobalEventHandlers['onplaying'] | null {
    return this.eventTarget.getEventListener('onplaying')
  }

  public get onpointercancel(): GlobalEventHandlers['onpointercancel'] | null {
    return this.eventTarget.getEventListener('onpointercancel')
  }

  public get onpointerdown(): GlobalEventHandlers['onpointerdown'] | null {
    return this.eventTarget.getEventListener('onpointerdown')
  }

  public get onpointerenter(): GlobalEventHandlers['onpointerenter'] | null {
    return this.eventTarget.getEventListener('onpointerenter')
  }

  public get onpointerleave(): GlobalEventHandlers['onpointerleave'] | null {
    return this.eventTarget.getEventListener('onpointerleave')
  }

  public get onpointermove(): GlobalEventHandlers['onpointermove'] | null {
    return this.eventTarget.getEventListener('onpointermove')
  }

  public get onpointerout(): GlobalEventHandlers['onpointerout'] | null {
    return this.eventTarget.getEventListener('onpointerout')
  }

  public get onpointerover(): GlobalEventHandlers['onpointerover'] | null {
    return this.eventTarget.getEventListener('onpointerover')
  }

  public get onpointerup(): GlobalEventHandlers['onpointerup'] | null {
    return this.eventTarget.getEventListener('onpointerup')
  }

  public get onprogress(): GlobalEventHandlers['onprogress'] | null {
    return this.eventTarget.getEventListener('onprogress')
  }

  public get onratechange(): GlobalEventHandlers['onratechange'] | null {
    return this.eventTarget.getEventListener('onratechange')
  }

  public get onreset(): GlobalEventHandlers['onreset'] | null {
    return this.eventTarget.getEventListener('onreset')
  }

  public get onresize(): GlobalEventHandlers['onresize'] | null {
    return this.eventTarget.getEventListener('onresize')
  }

  public get onscroll(): GlobalEventHandlers['onscroll'] | null {
    return this.eventTarget.getEventListener('onscroll')
  }

  public get onscrollend(): GlobalEventHandlers['onscrollend'] | null {
    return this.eventTarget.getEventListener('onscrollend')
  }

  public get onsecuritypolicyviolation(): GlobalEventHandlers['onsecuritypolicyviolation'] | null {
    return this.eventTarget.getEventListener('onsecuritypolicyviolation')
  }

  public get onseeked(): GlobalEventHandlers['onseeked'] | null {
    return this.eventTarget.getEventListener('onseeked')
  }

  public get onseeking(): GlobalEventHandlers['onseeking'] | null {
    return this.eventTarget.getEventListener('onseeking')
  }

  public get onselect(): GlobalEventHandlers['onselect'] | null {
    return this.eventTarget.getEventListener('onselect')
  }

  public get onselectionchange(): GlobalEventHandlers['onselectionchange'] | null {
    return this.eventTarget.getEventListener('onselectionchange')
  }

  public get onselectstart(): GlobalEventHandlers['onselectstart'] | null {
    return this.eventTarget.getEventListener('onselectstart')
  }

  public get onslotchange(): GlobalEventHandlers['onslotchange'] | null {
    return this.eventTarget.getEventListener('onslotchange')
  }

  public get onstalled(): GlobalEventHandlers['onstalled'] | null {
    return this.eventTarget.getEventListener('onstalled')
  }

  public get onsubmit(): GlobalEventHandlers['onsubmit'] | null {
    return this.eventTarget.getEventListener('onsubmit')
  }

  public get onsuspend(): GlobalEventHandlers['onsuspend'] | null {
    return this.eventTarget.getEventListener('onsuspend')
  }

  public get ontimeupdate(): GlobalEventHandlers['ontimeupdate'] | null {
    return this.eventTarget.getEventListener('ontimeupdate')
  }

  public get ontoggle(): GlobalEventHandlers['ontoggle'] | null {
    return this.eventTarget.getEventListener('ontoggle')
  }

  public get ontouchcancel(): GlobalEventHandlers['ontouchcancel'] | null {
    return this.eventTarget.getEventListener('ontouchcancel')
  }

  public get ontouchend(): GlobalEventHandlers['ontouchend'] | null {
    return this.eventTarget.getEventListener('ontouchend')
  }

  public get ontouchmove(): GlobalEventHandlers['ontouchmove'] | null {
    return this.eventTarget.getEventListener('ontouchmove')
  }

  public get ontouchstart(): GlobalEventHandlers['ontouchstart'] | null {
    return this.eventTarget.getEventListener('ontouchstart')
  }

  public get ontransitioncancel(): GlobalEventHandlers['ontransitioncancel'] | null {
    return this.eventTarget.getEventListener('ontransitioncancel')
  }

  public get ontransitionend(): GlobalEventHandlers['ontransitionend'] | null {
    return this.eventTarget.getEventListener('ontransitionend')
  }

  public get ontransitionrun(): GlobalEventHandlers['ontransitionrun'] | null {
    return this.eventTarget.getEventListener('ontransitionrun')
  }

  public get ontransitionstart(): GlobalEventHandlers['ontransitionstart'] | null {
    return this.eventTarget.getEventListener('ontransitionstart')
  }

  public get onvolumechange(): GlobalEventHandlers['onvolumechange'] | null {
    return this.eventTarget.getEventListener('onvolumechange')
  }

  public get onwaiting(): GlobalEventHandlers['onwaiting'] | null {
    return this.eventTarget.getEventListener('onwaiting')
  }

  public get onwebkitanimationend(): GlobalEventHandlers['onwebkitanimationend'] | null { // NOSONAR
    return this.eventTarget.getEventListener('onwebkitanimationend')
  }

  public get onwebkitanimationiteration(): GlobalEventHandlers['onwebkitanimationiteration'] | null { // NOSONAR
    return this.eventTarget.getEventListener('onwebkitanimationiteration')
  }

  public get onwebkitanimationstart(): GlobalEventHandlers['onwebkitanimationstart'] | null { // NOSONAR
    return this.eventTarget.getEventListener('onwebkitanimationstart')
  }

  public get onwebkittransitionend(): GlobalEventHandlers['onwebkittransitionend'] | null { // NOSONAR
    return this.eventTarget.getEventListener('onwebkittransitionend')
  }

  public get onwheel(): GlobalEventHandlers['onwheel'] | null {
    return this.eventTarget.getEventListener('onwheel')
  }

  // Setter

  public set onabort(listener: GlobalEventHandlers['onabort']) {
    this.eventTarget.setEventListener('onabort', 'abort', listener)
  }

  public set onanimationcancel(listener: GlobalEventHandlers['onanimationcancel']) {
    this.eventTarget.setEventListener('onanimationcancel', 'animationcancel', listener)
  }

  public set onanimationend(listener: GlobalEventHandlers['onanimationend']) {
    this.eventTarget.setEventListener('onanimationend', 'animationend', listener)
  }

  public set onanimationiteration(listener: GlobalEventHandlers['onanimationiteration']) {
    this.eventTarget.setEventListener('onanimationiteration', 'animationiteration', listener)
  }

  public set onanimationstart(listener: GlobalEventHandlers['onanimationstart']) {
    this.eventTarget.setEventListener('onanimationstart', 'animationstart', listener)
  }

  public set onauxclick(listener: GlobalEventHandlers['onauxclick']) {
    this.eventTarget.setEventListener('onauxclick', 'auxclick', listener)
  }

  public set onbeforeinput(listener: GlobalEventHandlers['onbeforeinput']) {
    this.eventTarget.setEventListener('onbeforeinput', 'beforeinput', listener)
  }

  public set onblur(listener: GlobalEventHandlers['onblur']) {
    this.eventTarget.setEventListener('onblur', 'blur', listener)
  }

  public set oncancel(listener: GlobalEventHandlers['oncancel']) {
    this.eventTarget.setEventListener('oncancel', 'cancel', listener)
  }

  public set oncanplay(listener: GlobalEventHandlers['oncanplay']) {
    this.eventTarget.setEventListener('oncanplay', 'canplay', listener)
  }

  public set oncanplaythrough(listener: GlobalEventHandlers['oncanplaythrough']) {
    this.eventTarget.setEventListener('oncanplaythrough', 'canplaythrough', listener)
  }

  public set onchange(listener: GlobalEventHandlers['onchange']) {
    this.eventTarget.setEventListener('onchange', 'change', listener)
  }

  public set onclick(listener: GlobalEventHandlers['onclick']) {
    this.eventTarget.setEventListener('onclick', 'click', listener)
  }

  public set onclose(listener: GlobalEventHandlers['onclose']) {
    this.eventTarget.setEventListener('onclose', 'close', listener)
  }

  public set oncontextmenu(listener: GlobalEventHandlers['oncontextmenu']) {
    this.eventTarget.setEventListener('oncontextmenu', 'contextmenu', listener)
  }

  public set oncopy(listener: GlobalEventHandlers['oncopy']) {
    this.eventTarget.setEventListener('oncopy', 'copy', listener)
  }

  public set oncuechange(listener: GlobalEventHandlers['oncuechange']) {
    this.eventTarget.setEventListener('oncuechange', 'cuechange', listener)
  }

  public set oncut(listener: GlobalEventHandlers['oncut']) {
    this.eventTarget.setEventListener('oncut', 'cut', listener)
  }

  public set ondblclick(listener: GlobalEventHandlers['ondblclick']) {
    this.eventTarget.setEventListener('ondblclick', 'dblclick', listener)
  }

  public set ondrag(listener: GlobalEventHandlers['ondrag']) {
    this.eventTarget.setEventListener('ondrag', 'drag', listener)
  }

  public set ondragend(listener: GlobalEventHandlers['ondragend']) {
    this.eventTarget.setEventListener('ondragend', 'dragend', listener)
  }

  public set ondragenter(listener: GlobalEventHandlers['ondragenter']) {
    this.eventTarget.setEventListener('ondragenter', 'dragenter', listener)
  }

  public set ondragleave(listener: GlobalEventHandlers['ondragleave']) {
    this.eventTarget.setEventListener('ondragleave', 'dragleave', listener)
  }

  public set ondragover(listener: GlobalEventHandlers['ondragover']) {
    this.eventTarget.setEventListener('ondragover', 'dragover', listener)
  }

  public set ondragstart(listener: GlobalEventHandlers['ondragstart']) {
    this.eventTarget.setEventListener('ondragstart', 'dragstart', listener)
  }

  public set ondrop(listener: GlobalEventHandlers['ondrop']) {
    this.eventTarget.setEventListener('ondrop', 'drop', listener)
  }

  public set ondurationchange(listener: GlobalEventHandlers['ondurationchange']) {
    this.eventTarget.setEventListener('ondurationchange', 'durationchange', listener)
  }

  public set onemptied(listener: GlobalEventHandlers['onemptied']) {
    this.eventTarget.setEventListener('onemptied', 'emptied', listener)
  }

  public set onended(listener: GlobalEventHandlers['onended']) {
    this.eventTarget.setEventListener('onended', 'ended', listener)
  }

  public set onerror(listener: GlobalEventHandlers['onerror']) {
    this.eventTarget.setEventListener('onerror', 'error', listener)
  }

  public set onfocus(listener: GlobalEventHandlers['onfocus']) {
    this.eventTarget.setEventListener('onfocus', 'focus', listener)
  }

  public set onformdata(listener: GlobalEventHandlers['onformdata']) {
    this.eventTarget.setEventListener('onformdata', 'formdata', listener)
  }

  public set ongotpointercapture(listener: GlobalEventHandlers['ongotpointercapture']) {
    this.eventTarget.setEventListener('ongotpointercapture', 'gotpointercapture', listener)
  }

  public set oninput(listener: GlobalEventHandlers['oninput']) {
    this.eventTarget.setEventListener('oninput', 'input', listener)
  }

  public set oninvalid(listener: GlobalEventHandlers['oninvalid']) {
    this.eventTarget.setEventListener('oninvalid', 'invalid', listener)
  }

  public set onkeydown(listener: GlobalEventHandlers['onkeydown']) {
    this.eventTarget.setEventListener('onkeydown', 'keydown', listener)
  }

  public set onkeypress(listener: GlobalEventHandlers['onkeypress']) { // NOSONAR
    this.eventTarget.setEventListener('onkeypress', 'keypress', listener)
  }

  public set onkeyup(listener: GlobalEventHandlers['onkeyup']) {
    this.eventTarget.setEventListener('onkeyup', 'keyup', listener)
  }

  public set onload(listener: GlobalEventHandlers['onload']) {
    this.eventTarget.setEventListener('onload', 'load', listener)
  }

  public set onloadeddata(listener: GlobalEventHandlers['onloadeddata']) {
    this.eventTarget.setEventListener('onloadeddata', 'loadeddata', listener)
  }

  public set onloadedmetadata(listener: GlobalEventHandlers['onloadedmetadata']) {
    this.eventTarget.setEventListener('onloadedmetadata', 'loadedmetadata', listener)
  }

  public set onloadstart(listener: GlobalEventHandlers['onloadstart']) {
    this.eventTarget.setEventListener('onloadstart', 'loadstart', listener)
  }

  public set onlostpointercapture(listener: GlobalEventHandlers['onlostpointercapture']) {
    this.eventTarget.setEventListener('onlostpointercapture', 'lostpointercapture', listener)
  }

  public set onmousedown(listener: GlobalEventHandlers['onmousedown']) {
    this.eventTarget.setEventListener('onmousedown', 'mousedown', listener)
  }

  public set onmouseenter(listener: GlobalEventHandlers['onmouseenter']) {
    this.eventTarget.setEventListener('onmouseenter', 'mouseenter', listener)
  }

  public set onmouseleave(listener: GlobalEventHandlers['onmouseleave']) {
    this.eventTarget.setEventListener('onmouseleave', 'mouseleave', listener)
  }

  public set onmousemove(listener: GlobalEventHandlers['onmousemove']) {
    this.eventTarget.setEventListener('onmousemove', 'mousemove', listener)
  }

  public set onmouseout(listener: GlobalEventHandlers['onmouseout']) {
    this.eventTarget.setEventListener('onmouseout', 'mouseout', listener)
  }

  public set onmouseover(listener: GlobalEventHandlers['onmouseover']) {
    this.eventTarget.setEventListener('onmouseover', 'mouseover', listener)
  }

  public set onmouseup(listener: GlobalEventHandlers['onmouseup']) {
    this.eventTarget.setEventListener('onmouseup', 'mouseup', listener)
  }

  public set onpaste(listener: GlobalEventHandlers['onpaste']) {
    this.eventTarget.setEventListener('onpaste', 'paste', listener)
  }

  public set onpause(listener: GlobalEventHandlers['onpause']) {
    this.eventTarget.setEventListener('onpause', 'pause', listener)
  }

  public set onplay(listener: GlobalEventHandlers['onplay']) {
    this.eventTarget.setEventListener('onplay', 'play', listener)
  }

  public set onplaying(listener: GlobalEventHandlers['onplaying']) {
    this.eventTarget.setEventListener('onplaying', 'playing', listener)
  }

  public set onpointercancel(listener: GlobalEventHandlers['onpointercancel']) {
    this.eventTarget.setEventListener('onpointercancel', 'pointercancel', listener)
  }

  public set onpointerdown(listener: GlobalEventHandlers['onpointerdown']) {
    this.eventTarget.setEventListener('onpointerdown', 'pointerdown', listener)
  }

  public set onpointerenter(listener: GlobalEventHandlers['onpointerenter']) {
    this.eventTarget.setEventListener('onpointerenter', 'pointerenter', listener)
  }

  public set onpointerleave(listener: GlobalEventHandlers['onpointerleave']) {
    this.eventTarget.setEventListener('onpointerleave', 'pointerleave', listener)
  }

  public set onpointermove(listener: GlobalEventHandlers['onpointermove']) {
    this.eventTarget.setEventListener('onpointermove', 'pointermove', listener)
  }

  public set onpointerout(listener: GlobalEventHandlers['onpointerout']) {
    this.eventTarget.setEventListener('onpointerout', 'pointerout', listener)
  }

  public set onpointerover(listener: GlobalEventHandlers['onpointerover']) {
    this.eventTarget.setEventListener('onpointerover', 'pointerover', listener)
  }

  public set onpointerup(listener: GlobalEventHandlers['onpointerup']) {
    this.eventTarget.setEventListener('onpointerup', 'pointerup', listener)
  }

  public set onprogress(listener: GlobalEventHandlers['onprogress']) {
    this.eventTarget.setEventListener('onprogress', 'progress', listener)
  }

  public set onratechange(listener: GlobalEventHandlers['onratechange']) {
    this.eventTarget.setEventListener('onratechange', 'ratechange', listener)
  }

  public set onreset(listener: GlobalEventHandlers['onreset']) {
    this.eventTarget.setEventListener('onreset', 'reset', listener)
  }

  public set onresize(listener: GlobalEventHandlers['onresize']) {
    this.eventTarget.setEventListener('onresize', 'resize', listener)
  }

  public set onscroll(listener: GlobalEventHandlers['onscroll']) {
    this.eventTarget.setEventListener('onscroll', 'scroll', listener)
  }

  public set onscrollend(listener: GlobalEventHandlers['onscrollend']) {
    this.eventTarget.setEventListener('onscrollend', 'scrollend', listener)
  }

  public set onsecuritypolicyviolation(listener: GlobalEventHandlers['onsecuritypolicyviolation']) {
    this.eventTarget.setEventListener('onsecuritypolicyviolation', 'securitypolicyviolation', listener)
  }

  public set onseeked(listener: GlobalEventHandlers['onseeked']) {
    this.eventTarget.setEventListener('onseeked', 'seeked', listener)
  }

  public set onseeking(listener: GlobalEventHandlers['onseeking']) {
    this.eventTarget.setEventListener('onseeking', 'seeking', listener)
  }

  public set onselect(listener: GlobalEventHandlers['onselect']) {
    this.eventTarget.setEventListener('onselect', 'select', listener)
  }

  public set onselectionchange(listener: GlobalEventHandlers['onselectionchange']) {
    this.eventTarget.setEventListener('onselectionchange', 'selectionchange', listener)
  }

  public set onselectstart(listener: GlobalEventHandlers['onselectstart']) {
    this.eventTarget.setEventListener('onselectstart', 'selectstart', listener)
  }

  public set onslotchange(listener: GlobalEventHandlers['onslotchange']) {
    this.eventTarget.setEventListener('onslotchange', 'slotchange', listener)
  }

  public set onstalled(listener: GlobalEventHandlers['onstalled']) {
    this.eventTarget.setEventListener('onstalled', 'stalled', listener)
  }

  public set onsubmit(listener: GlobalEventHandlers['onsubmit']) {
    this.eventTarget.setEventListener('onsubmit', 'submit', listener)
  }

  public set onsuspend(listener: GlobalEventHandlers['onsuspend']) {
    this.eventTarget.setEventListener('onsuspend', 'suspend', listener)
  }

  public set ontimeupdate(listener: GlobalEventHandlers['ontimeupdate']) {
    this.eventTarget.setEventListener('ontimeupdate', 'timeupdate', listener)
  }

  public set ontoggle(listener: GlobalEventHandlers['ontoggle']) {
    this.eventTarget.setEventListener('ontoggle', 'toggle', listener)
  }

  public set ontouchcancel(listener: GlobalEventHandlers['ontouchcancel']) {
    this.eventTarget.setEventListener('ontouchcancel', 'touchcancel', listener)
  }

  public set ontouchend(listener: GlobalEventHandlers['ontouchend']) {
    this.eventTarget.setEventListener('ontouchend', 'touchend', listener)
  }

  public set ontouchmove(listener: GlobalEventHandlers['ontouchmove']) {
    this.eventTarget.setEventListener('ontouchmove', 'touchmove', listener)
  }

  public set ontouchstart(listener: GlobalEventHandlers['ontouchstart']) {
    this.eventTarget.setEventListener('ontouchstart', 'touchstart', listener)
  }

  public set ontransitioncancel(listener: GlobalEventHandlers['ontransitioncancel']) {
    this.eventTarget.setEventListener('ontransitioncancel', 'transitioncancel', listener)
  }

  public set ontransitionend(listener: GlobalEventHandlers['ontransitionend']) {
    this.eventTarget.setEventListener('ontransitionend', 'transitionend', listener)
  }

  public set ontransitionrun(listener: GlobalEventHandlers['ontransitionrun']) {
    this.eventTarget.setEventListener('ontransitionrun', 'transitionrun', listener)
  }

  public set ontransitionstart(listener: GlobalEventHandlers['ontransitionstart']) {
    this.eventTarget.setEventListener('ontransitionstart', 'transitionstart', listener)
  }

  public set onvolumechange(listener: GlobalEventHandlers['onvolumechange']) {
    this.eventTarget.setEventListener('onvolumechange', 'volumechange', listener)
  }

  public set onwaiting(listener: GlobalEventHandlers['onwaiting']) {
    this.eventTarget.setEventListener('onwaiting', 'waiting', listener)
  }

  public set onwebkitanimationend(listener: GlobalEventHandlers['onwebkitanimationend']) { // NOSONAR
    this.eventTarget.setEventListener('onwebkitanimationend', 'webkitanimationend', listener)
  }

  public set onwebkitanimationiteration(listener: GlobalEventHandlers['onwebkitanimationiteration']) { // NOSONAR
    this.eventTarget.setEventListener('onwebkitanimationiteration', 'webkitanimationiteration', listener)
  }

  public set onwebkitanimationstart(listener: GlobalEventHandlers['onwebkitanimationstart']) { // NOSONAR
    this.eventTarget.setEventListener('onwebkitanimationstart', 'webkitanimationstart', listener)
  }

  public set onwebkittransitionend(listener: GlobalEventHandlers['onwebkittransitionend']) { // NOSONAR
    this.eventTarget.setEventListener('onwebkittransitionend', 'webkittransitionend', listener)
  }

  public set onwheel(listener: GlobalEventHandlers['onwheel']) {
    this.eventTarget.setEventListener('onwheel', 'wheel', listener)
  }

  public set src(src: string) {
    this.eventTarget.dispatchEvent('srcchange', new CustomEvent('srcchange', { cancelable: true, detail: src }))
  }

  /// Private ///

  private static original: (typeof Image) | null = null
  private static callback: ((this: InterceptImage, type: keyof HTMLMediaElementEventMap, evt: Event) => void) | null = null

  private readonly eventTarget: InterceptEventTargetAdapter<GlobalEventHandlers, HTMLMediaElementEventMap>

  private onEvent(type: keyof HTMLMediaElementEventMap, evt: Event): void {
    InterceptImage.callback?.call(this, type, evt)
  }

  private onSrcChange(evt: CustomEvent<string>): void {
    super.src = evt.detail
  }
}