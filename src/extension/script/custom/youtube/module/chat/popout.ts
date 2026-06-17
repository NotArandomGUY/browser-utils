import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTResponse, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { YTPolymerConnectCallback } from '@ext/custom/youtube/module/core/bootstrap'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
import { registerYTConfigMenuItemGroup, YTConfigMenuItemType } from '@ext/custom/youtube/module/core/config'
import { getYTPMainPlayer, YTPVideoPlayerInstance } from '@ext/custom/youtube/module/player/bootstrap'
import ContinuationToken, { LiveChatContinuationToken } from '@ext/custom/youtube/proto/continuation-token'
import LiveChatParams, { LiveChatQuery, LiveChatQueryContent } from '@ext/custom/youtube/proto/live-chat-params'
import { getNonce } from '@ext/custom/youtube/utils/crypto'
import { ytuiShowToast } from '@ext/custom/youtube/utils/ytui'
import { ceil, floor, max, min, sqrt } from '@ext/global/math'
import { assign, defineProperty, getPropertyDescriptor, getPrototypeOf } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import { addInterceptNetworkCallback, NetworkContext, NetworkContextState, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'
import MessageChannel, { ChannelMessageData } from '@ext/lib/message/channel'

const logger = new Logger('YTCHAT-POPOUT')

const CHANNEL_NAME = 'bmc-ytchat-popout'
const IFRAME_WARMUP_DURATION = 5e3 // 5 sec
const POPOUT_KEEPALIVE_TIMEOUT = 25e3 // 25 sec
const PLAYER_KEEPALIVE_TIMEOUT = 60e3 // 1 min
const LIVE_CHAT_MIN_W = 298
const LIVE_CHAT_MIN_H = 320

const LiveChatPathname = '/live_chat'
const LiveChatReplayPathname = '/live_chat_replay'
const LiveChatShellUrl = `${location.origin}${LiveChatPathname}?continuation=${bufferToString(new ContinuationToken({
  liveChatContinuation: new LiveChatContinuationToken({
    params: bufferToString(new LiveChatParams({
      query: new LiveChatQuery({ content: new LiveChatQueryContent() }),
      b4: 1
    }).serialize(), 'base64url')
  })
}).serialize(), 'base64url')}`
const LiveChatShellContent = {
  header: {
    liveChatHeaderRenderer: {}
  },
  actionPanel: {
    messageRenderer: {
      text: { simpleText: 'Waiting for live stream/live stream replay...' }
    }
  }
} satisfies YTValueData<YTRenderer.Mapped<'liveChatRenderer'>>
const LiveChatShellBootstrap = {
  contents: {
    liveChatRenderer: LiveChatShellContent
  }
} satisfies YTValueData<YTResponse.Mapped<'liveChatGetLiveChat'>>

interface YTActionMap {
  'yt-live-chat-buy-flow-callback': {
    success: boolean
    response?: { data?: { command?: YTValueData<{ type: YTValueType.ENDPOINT }> } }
    errorMessageRenderer?: YTValueData<{ type: YTValueType.RENDERER }>
  }
  'yt-live-chat-close-buy-flow': true
  'yt-live-chat-forward-redux-action': unknown
  'yt-live-chat-keyboard-event': { eventType: string, keyCode: number }
  'yt-live-chat-set-dark-theme': boolean
  'yt-player-ad-start': string
  'yt-player-ad-end': true
  'yt-player-state-change': number
  'yt-player-video-progress': number
}

interface YTAction {
  actionName: string
  optionalAction: boolean
  args: unknown[] | null
  returnValue: unknown[]
}

type ChatBinding = [continuation: string, isReplay: boolean]

const enum PopoutMessageType {
  BINDING_INIT,
  BINDING_INIT_ACK,
  BINDING_SYNC,
  BINDING_DROP,
  BINDING_KEEPALIVE,
  PLAYER_ANNOUNCE,
  POPOUT_ANNOUNCE,
  POPOUT_TRANSFER,
  POPOUT_TRANSFER_ACK,
  PLAYER_TRANSFER,
  TRIGGER_ACTION
}

type PopoutMessageDataMap = {
  [PopoutMessageType.BINDING_INIT]: []
  [PopoutMessageType.BINDING_INIT_ACK]: []
  [PopoutMessageType.BINDING_SYNC]: [binding: ChatBinding]
  [PopoutMessageType.BINDING_DROP]: []
  [PopoutMessageType.BINDING_KEEPALIVE]: []
  [PopoutMessageType.PLAYER_ANNOUNCE]: []
  [PopoutMessageType.POPOUT_ANNOUNCE]: []
  [PopoutMessageType.POPOUT_TRANSFER]: [key: string]
  [PopoutMessageType.POPOUT_TRANSFER_ACK]: [target: number]
  [PopoutMessageType.PLAYER_TRANSFER]: [target: number]
  [PopoutMessageType.TRIGGER_ACTION]: { [N in keyof YTActionMap]: [name: N, data: YTActionMap[N]] }[keyof YTActionMap]
}

const YTLiveChatAppTagName = 'yt-live-chat-app'
const YTLiveChatAppChannel = Symbol()

interface YTLiveChatApp extends HTMLElement {
  is: typeof YTLiveChatAppTagName

  ytActionRouterBehavior?: Partial<{
    actionRouter_: Partial<{
      actionRoutingMap: Map<string, Map<HTMLElement | { hostElement: HTMLElement } | number, (...args: unknown[]) => void>>

      triggerAction(actionName: string): void
      triggerOptionalAction(actionName: string): void
      handleAction(action: YTAction): void
    }>

    created(): void
    attached(): void
    detached(): void
    onYtAction_(event: CustomEvent<YTAction>): void
    onYtActionBoundListener_(event: CustomEvent<YTAction>): void
  }>

  [YTLiveChatAppChannel]?: ChatAppMessageChannel
}

const YTLiveChatRendererTagName = 'yt-live-chat-renderer'

interface YTLiveChatRenderer extends HTMLElement {
  is: typeof YTLiveChatRendererTagName

  data?: YTValueData<YTRenderer.Mapped<'liveChatRenderer'>>
  bannerManager?: Partial<{
    reset(): void
  }>
}

const YTLiveChatHeaderRendererTagName = 'yt-live-chat-header-renderer'

const documentHidden = getPropertyDescriptor(document, 'hidden')?.get?.bind(document)

const getGridSize = (width: number, height: number, items: number): [cols: number, rows: number, overflow: boolean] => {
  const ratio = (width / height) || 1
  const cols = min(items, ceil(sqrt(items * (ratio / (LIVE_CHAT_MIN_W / LIVE_CHAT_MIN_H))))) || 1
  const rows = ceil(items / cols) || 1

  return [cols, rows, (width / cols) < LIVE_CHAT_MIN_W || (height / rows) < LIVE_CHAT_MIN_H]
}

const getContinuationParams = (encodedToken = ''): string | null => {
  try {
    const { liveChatContinuation, liveChatReplayContinuation } = new ContinuationToken().deserialize(bufferFromString(encodedToken, 'base64url'))

    return (liveChatContinuation ?? liveChatReplayContinuation)?.params ?? null
  } catch {
    return null
  }
}

const updateGetLiveChatResponse = (data: YTValueData<YTResponse.Mapped<'liveChatGetLiveChat' | 'liveChatGetLiveChatReplay'>>) => {
  delete data.continuationContents?.liveChatContinuation?.header?.liveChatHeaderRenderer?.collapseButton
}

class MainAppMessageChannel extends MessageChannel<PopoutMessageDataMap, PopoutMessageType> {
  private player_: YTPVideoPlayerInstance | null = null
  private binding_: ChatBinding | null = null
  private boundedPopoutTimeout_: number = 0
  private unboundPopoutTimeout_: number

  public constructor() {
    super(CHANNEL_NAME, false)

    this.unboundPopoutTimeout_ = Date.now() + IFRAME_WARMUP_DURATION

    registerYTConfigMenuItemGroup('general', [
      {
        type: YTConfigMenuItemType.BUTTON,
        key: 'open-popout-chat',
        icon: YTRenderer.enums.IconType.CHAT,
        text: 'Open popout chat',
        signals: [YTEndpoint.enums.SignalActionType.OPEN_POPOUT_CHAT, YTEndpoint.enums.SignalActionType.CLOSE_POPUP]
      }
    ])
    registerYTSignalActionHandler(YTEndpoint.enums.SignalActionType.OPEN_POPOUT_CHAT, () => {
      const popoutWindow = open('about:blank', Math.random().toString(36), 'menubar=0,location=0,scrollbars=0,toolbar=0,width=600,height=600')
      if (popoutWindow == null) return ytuiShowToast('Failed to open popout window', 5e3)

      popoutWindow.location.replace(LiveChatShellUrl)
    })
    registerYTValueProcessor(YTRenderer.mapped.liveChatRenderer, data => {
      const { boundedPopoutTimeout_, unboundPopoutTimeout_ } = this
      const { continuations, isReplay } = data

      const continuation = continuations?.map(c => c.reloadContinuationData?.continuation).find(c => c != null)
      if (continuation == null) {
        logger.debug('missing continuation for live chat')
        return
      }

      // Use iframe if popout chat is not available
      const timeout = max(boundedPopoutTimeout_, unboundPopoutTimeout_)
      data.initialDisplayState = `LIVE_CHAT_DISPLAY_STATE_${Date.now() > timeout ? 'EXPANDED' : 'COLLAPSED'}`

      this.load_([continuation, !!isReplay])
    })
    registerYTValueProcessor(YTResponse.mapped.next, (data: YTValueData<YTResponse.Mapped<'next'>>) => {
      if (data.contents) this.unload_()
    })

    setInterval(this.update_.bind(this), 5e3)

    window.addEventListener('beforeunload', this.unload_.bind(this))
  }

  public bind(target: number | null): boolean {
    const { source, boundTo } = this

    if (!super.bind(target)) return false

    if (boundTo != null) logger.debug(`player '${source}' unbind popout '${boundTo}'`)
    if (target != null) logger.debug(`player '${source}' bind popout '${target}'`)

    this.boundedPopoutTimeout_ = Date.now() + 1e3
    this.update_()

    return true
  }

  protected onBroadcast(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    const { source } = message

    switch (message.type) { // NOSONAR
      case PopoutMessageType.POPOUT_ANNOUNCE:
        logger.debug(`popout '${source}' announce`)

        this.unboundPopoutTimeout_ = Date.now() + POPOUT_KEEPALIVE_TIMEOUT
        return
      default:
        logger.trace('main app dropped broadcast:', message)
        return
    }
  }

  protected onMessage(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    const { boundTo, binding_ } = this
    const { source } = message

    switch (message.type) {
      case PopoutMessageType.BINDING_INIT:
        if (binding_ == null) return

        this.send(PopoutMessageType.BINDING_INIT, [], source)
        return
      case PopoutMessageType.BINDING_INIT_ACK:
        if (binding_ == null) return

        this.send(PopoutMessageType.BINDING_SYNC, [binding_], source)
        if (!this.bind(source)) this.update_()
        return
      case PopoutMessageType.BINDING_KEEPALIVE:
        this.keepalive_()
        return
      case PopoutMessageType.PLAYER_TRANSFER:
        if (boundTo == null) return

        this.bind(message.data[0])
        return
      default:
        logger.trace('main app dropped message:', message)
        return
    }
  }

  private onPlayerProgress_(): void {
    this.send(PopoutMessageType.TRIGGER_ACTION, ['yt-player-video-progress', this.player_?.getCurrentTime?.() ?? 0])
  }

  private onPlayerAdStart_(cpn: string): void {
    this.send(PopoutMessageType.TRIGGER_ACTION, ['yt-player-ad-start', cpn])
  }

  private onPlayerAdEnd_(): void {
    this.send(PopoutMessageType.TRIGGER_ACTION, ['yt-player-ad-end', true])
  }

  private onPlayerStateChange_(state: number): void {
    this.send(PopoutMessageType.TRIGGER_ACTION, ['yt-player-state-change', state])
  }

  private load_(binding: ChatBinding): void {
    logger.debug('live chat load:', binding)

    this.binding_ = binding

    // Attempt to initiate binding with last channel or fallback to any available channel
    if (!this.send(PopoutMessageType.BINDING_INIT, [])) {
      this.broadcast(PopoutMessageType.BINDING_INIT, [])
    }
  }

  private unload_(): void {
    const { binding_ } = this

    if (binding_ == null) return

    logger.debug('live chat unload:', binding_)

    this.binding_ = null
    this.setPlayer_(null)

    this.send(PopoutMessageType.BINDING_DROP, [])
  }

  private keepalive_(): void {
    const { source, boundTo, binding_ } = this

    if (boundTo == null) return

    logger.debug(`player '${source}' keepalive popout '${boundTo}'`)

    this.boundedPopoutTimeout_ = Date.now() + POPOUT_KEEPALIVE_TIMEOUT
    if (binding_?.[1]) this.onPlayerProgress_()
  }

  private setPlayer_(player: YTPVideoPlayerInstance | null = null): void {
    const { player_, onPlayerProgress_, onPlayerAdStart_, onPlayerAdEnd_, onPlayerStateChange_, unload_ } = this

    if (player_ === player) return
    if (player_ && player) this.setPlayer_(null)

    this.player_ = player

    const action = player?.subscribe?.bind(player) ?? player_?.unsubscribe?.bind(player_)
    if (action == null) return

    action('onVideoProgress', onPlayerProgress_, this)
    action('onAdStart', onPlayerAdStart_, this)
    action('onAdEnd', onPlayerAdEnd_, this)
    action('onStateChange', onPlayerStateChange_, this)
    action('internalAbandon', unload_, this)
  }

  private update_(): void {
    const { boundTo, binding_, boundedPopoutTimeout_ } = this

    if (binding_ != null) this.setPlayer_(getYTPMainPlayer())

    if (boundTo == null) {
      // Notify popout to assign an app to this player
      if (binding_ != null && !documentHidden?.()) this.broadcast(PopoutMessageType.PLAYER_ANNOUNCE, [])
      return
    }

    if (Date.now() > boundedPopoutTimeout_) {
      this.bind(null)
    } else {
      this.send(PopoutMessageType.BINDING_KEEPALIVE, [])
    }
  }
}

class ChatAppMessageChannel extends MessageChannel<PopoutMessageDataMap, PopoutMessageType> {
  public readonly app: YTLiveChatApp

  private readonly shell_: ChatShellMessageChannel
  private transferKey_: string | null = null
  private binding_: ChatBinding | null = null
  private timeout_: number

  public constructor(shell: ChatShellMessageChannel, app: YTLiveChatApp, channelId: number) {
    super(CHANNEL_NAME, true, channelId)

    this.app = app
    this.shell_ = shell
    this.timeout_ = Date.now() + 1e3

    assign(app.style, {
      border: 'solid 1px #555',
      height: `100vh`,
      flexBasis: `100vw`,
      flexGrow: '1',
      flexShrink: '0',
      boxSizing: 'border-box'
    } satisfies Partial<CSSStyleDeclaration>)

    app.addEventListener('mousedown', this.onMouseDown_.bind(this))
    app.addEventListener('mouseup', this.onMouseUp_.bind(this))
    app.addEventListener('dragstart', this.onDragStart_.bind(this))
    app.addEventListener('drag', this.onDrag_.bind(this))
    app.addEventListener('dragend', this.onDragEnd_.bind(this))

    app[YTLiveChatAppChannel] = this
  }

  private get renderer_(): YTLiveChatRenderer | null {
    const { app } = this

    return app.querySelector<YTLiveChatRenderer>(YTLiveChatRendererTagName)
  }

  public bind(target: number | null): boolean {
    const { source, boundTo } = this

    if (!super.bind(target)) return false

    if (boundTo != null) logger.debug(`popout '${source}' unbind player '${boundTo}'`)
    if (target != null) logger.debug(`popout '${source}' bind player '${target}'`)

    this.timeout_ = Date.now() + 1e3
    this.update()

    return true
  }

  public update(): void {
    const { source, shell_, timeout_, renderer_ } = this

    if (Date.now() <= timeout_) {
      this.send(PopoutMessageType.BINDING_KEEPALIVE, [])
      return
    }
    if (this.bind(null)) return

    if (renderer_?.data !== LiveChatShellContent && this.setRendererData_(LiveChatShellContent, true)) {
      logger.debug(`popout '${source}' unloaded content`)
    }

    this.binding_ = null
    shell_.setVisibility(this, false)
  }

  protected onBroadcast(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    const { boundTo, transferKey_ } = this
    const { source } = message

    switch (message.type) { // NOSONAR
      case PopoutMessageType.BINDING_INIT:
        return this.onMessage(message)
      case PopoutMessageType.POPOUT_TRANSFER:
        if (boundTo == null || transferKey_ == null || message.data[0] !== transferKey_) return

        this.send(PopoutMessageType.PLAYER_TRANSFER, [source])
        this.send(PopoutMessageType.POPOUT_TRANSFER_ACK, [boundTo], source)
        this.bind(null)
        this.timeout_ = 0
        return
      default:
        logger.trace('chat app dropped broadcast:', message)
        return
    }
  }

  protected onMessage(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    const { boundTo, app } = this
    const { source } = message

    switch (message.type) {
      case PopoutMessageType.BINDING_INIT:
        this.send(PopoutMessageType.BINDING_INIT_ACK, [], source)
        return
      case PopoutMessageType.BINDING_SYNC:
        if (this.load_(message.data[0])) this.bind(source)
        return
      case PopoutMessageType.BINDING_DROP:
        this.bind(null)
        return
      case PopoutMessageType.BINDING_KEEPALIVE:
        this.keepalive_()
        return
      case PopoutMessageType.POPOUT_TRANSFER_ACK:
        if (boundTo == null || !this.bind(message.data[0])) return

        this.send(PopoutMessageType.BINDING_INIT, [])
        return
      case PopoutMessageType.TRIGGER_ACTION: {
        if (boundTo == null) return

        const [name, data] = message.data

        app.dispatchEvent(new CustomEvent<YTAction>('yt-action', {
          bubbles: true,
          cancelable: false,
          composed: true,
          detail: {
            actionName: name.replace(/^yt-player-/, 'yt-live-player-'),
            args: [data],
            optionalAction: true,
            returnValue: []
          }
        }))
        return
      }
      default:
        logger.trace('chat app dropped message:', message)
        return
    }
  }

  private setRendererData_(data: YTValueData<YTRenderer.Mapped<'liveChatRenderer'>>, replace?: boolean): boolean {
    const { renderer_ } = this

    if (renderer_ == null) return false

    renderer_.bannerManager?.reset?.()
    renderer_.data = replace ? data : { ...renderer_.data, ...data }

    return true
  }

  private load_(binding: ChatBinding): boolean {
    const { source, shell_, binding_ } = this
    const [continuation, isReplay] = binding

    const oldParams = getContinuationParams(binding_?.[0])
    const newParams = getContinuationParams(continuation)
    if (newParams === oldParams) return true

    logger.debug(`popout '${source}' load content by params:`, newParams)

    this.binding_ = binding
    shell_.setVisibility(this, true)

    return this.setRendererData_({ continuations: [{ reloadContinuationData: { continuation } }], isReplay })
  }

  private keepalive_(): void {
    const { source, boundTo } = this

    if (boundTo == null) return

    logger.debug(`popout '${source}' keepalive player '${boundTo}'`)

    this.timeout_ = Date.now() + PLAYER_KEEPALIVE_TIMEOUT
  }

  private onMouseDown_({ target }: MouseEvent): void {
    const { app } = this

    const closest = target instanceof HTMLElement ? target.closest(`${YTLiveChatHeaderRendererTagName},button,tp-yt-paper-button`) : null
    if (closest?.tagName.toLowerCase() !== YTLiveChatHeaderRendererTagName) return

    app.setAttribute('draggable', 'true')
  }

  private onMouseUp_(): void {
    const { app } = this

    app.removeAttribute('draggable')
  }

  private onDragStart_(event: DragEvent): void {
    const { source, binding_ } = this
    const { dataTransfer } = event

    if (binding_ == null) {
      event.preventDefault()
      return
    }

    if (dataTransfer == null) return

    const key = getNonce(16)
    this.transferKey_ = key

    dataTransfer.effectAllowed = 'move'
    dataTransfer['setData']('text/plain', `${LiveChatShellUrl}#${source}#${key}`)
  }

  private onDrag_({ clientX, clientY }: DragEvent): void {
    const { shell_ } = this

    if (clientX || clientY) shell_.setPosition(this, clientX, clientY)
  }

  private onDragEnd_(event: DragEvent): void {
    this.onDrag_(event)
    this.onMouseUp_()
  }
}

class ChatShellMessageChannel extends MessageChannel<PopoutMessageDataMap, PopoutMessageType> {
  private readonly background_: ChatAppMessageChannel[] = []
  private readonly foreground_: ChatAppMessageChannel[] = []
  private channelId_: number = 0
  private cols_: number = 0
  private rows_: number = 0
  private full_: boolean = true

  public constructor() {
    super(CHANNEL_NAME, true)

    defineProperty(window, 'ytInitialData', {
      configurable: true,
      enumerable: true,
      get() { return LiveChatShellBootstrap },
      set() { return }
    })

    YTPolymerConnectCallback.registerCallback(element => {
      if (element.is !== YTLiveChatAppTagName || YTLiveChatAppChannel in element) return

      const channel = this.initApp_(element as YTLiveChatApp)
      if (channel == null) return

      const behavior = channel.app.ytActionRouterBehavior
      if (behavior == null) {
        logger.warn('failed to find action router behavior')
        return
      }
      let { ['actionRouter_']: actionRouter, ['onYtAction_']: onYtAction } = behavior

      const actionRoutingMap = actionRouter?.actionRoutingMap
      if (onYtAction == null || actionRoutingMap == null) {
        logger.warn('failed to find action router fields')
        return
      }

      onYtAction = new Hook(onYtAction).install(ctx => {
        try {
          const { args: [event] } = ctx

          if (!(event instanceof CustomEvent)) throw new Error('unexpected argument')

          const { target, detail: { actionName, optionalAction, args: optionalArgs, returnValue } } = event

          const targetApp = target instanceof HTMLElement ? target.closest<YTLiveChatApp>(YTLiveChatAppTagName) : null
          const args = optionalArgs ?? []

          actionRoutingMap.get(actionName)?.forEach((callback, key) => {
            if (typeof callback !== 'function') throw new Error('invalid action callback')

            let callbackApp: HTMLElement | undefined | null
            if (key instanceof HTMLElement) {
              callbackApp = key
            } else if (typeof key === 'object' && 'hostElement' in key) {
              callbackApp = key.hostElement
            }
            callbackApp = callbackApp?.closest<YTLiveChatApp>(YTLiveChatAppTagName)

            if (targetApp != null && callbackApp != null && targetApp !== callbackApp) return

            returnValue.push(callback(...args))
          })

          if (!optionalAction && returnValue.length === 0) throw new Error('unhandled action')

          return HookResult.EXECUTION_CONTINUE
        } catch (error) {
          logger.debug('handle action error:', error)
          return HookResult.EXECUTION_PASSTHROUGH
        }
      }).call

      getPrototypeOf(behavior)['onYtAction_'] = onYtAction
      behavior['onYtActionBoundListener_'] = onYtAction.bind(behavior)
    })

    registerYTValueProcessor(YTResponse.mapped.liveChatGetLiveChat, updateGetLiveChatResponse)
    registerYTValueProcessor(YTResponse.mapped.liveChatGetLiveChatReplay, updateGetLiveChatResponse)

    // Only load unicode emoji once
    let emojiJsonUrl: string | undefined
    let loadedEmojiJson = false

    addInterceptNetworkCallback(ctx => {
      const { url, state } = ctx

      if (state !== NetworkState.UNSENT) return

      emojiJsonUrl ??= ytcfg?.get<Record<string, string>>('EXPERIMENT_FLAGS')?.['live_chat_unicode_emoji_json_url']
      if (url.href !== emojiJsonUrl) return

      if (!loadedEmojiJson) {
        loadedEmojiJson = true
        return
      }

      assign<NetworkContext, NetworkContextState>(ctx, { state: NetworkState.SUCCESS, response: new Response('[]', { headers: { 'content-type': 'application/json' } }) })
    })

    addEventListener('load', () => {
      document.title = 'Live chat'
      assign(document.body.style, {
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: 'var(--yt-live-chat-background-color, #0F0F0F)',
        color: 'var(--yt-live-chat-primary-text-color, #FFF)',
        overflow: 'hidden',
        flexWrap: 'wrap',
        justifyContent: 'stretch'
      } satisfies Partial<CSSStyleDeclaration>)

      this.transfer_(location.href)

      history.replaceState(null, '', LiveChatShellUrl)
    })
    addEventListener('resize', this.resizeGrid_.bind(this, false))
    addEventListener('dragover', this.onDragOver_.bind(this))
    addEventListener('drop', this.onDrop_.bind(this))

    setInterval(this.update_.bind(this), 1e3)
  }

  /*@__MANGLE_PROP__*/public setVisibility(channel: ChatAppMessageChannel, visible: boolean): void {
    const { background_, foreground_ } = this
    const { source, app } = channel

    let src: ChatAppMessageChannel[]
    let dst: ChatAppMessageChannel[]
    if (visible) {
      src = background_
      dst = foreground_
    } else {
      src = foreground_
      dst = background_
    }

    const srcIdx = src.indexOf(channel)
    if (srcIdx < 0) return
    dst.push(...src.splice(srcIdx, 1))

    logger.debug(`popout '${source}' visibility changed to '${visible}'`)

    this.resizeGrid_(true)
    if (visible) {
      // Cleanup placeholder items
      background_.forEach(({ app }) => app.remove())

      document.body.append(app)
    } else if (foreground_.length > 0) {
      // Remove until there is only one item left which is kept as placeholder
      app.remove()
    }
  }

  /*@__MANGLE_PROP__*/public setPosition(channel: ChatAppMessageChannel, x: number, y: number): void {
    const { foreground_, cols_, rows_ } = this
    const { source, app } = channel

    const col = max(0, min(cols_, floor(cols_ * (x / innerWidth)))) || 0
    const row = max(0, min(rows_, floor(rows_ * (y / innerHeight)))) || 0

    const srcIdx = foreground_.indexOf(channel)
    const dstIdx = min(foreground_.length - 1, (row * cols_) + col)
    if (srcIdx < 0 || dstIdx < 0 || srcIdx === dstIdx) return

    logger.debug(`popout '${source}' position changed to (${col},${row}/${dstIdx})`)

    foreground_.splice(srcIdx, 1)
    foreground_.splice(dstIdx, 0, channel)

    const nextNode = foreground_[dstIdx + 1]?.app ?? null
    document.body.insertBefore(app, nextNode)
  }

  protected onBroadcast(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    const { source } = message

    switch (message.type) { // NOSONAR
      case PopoutMessageType.PLAYER_ANNOUNCE: {
        // Find or allocate unbounded chat app
        const channel = this.grabApp_()
        if (channel == null) return

        // Initiate binding to player
        if (channel.bind(source)) channel.send(PopoutMessageType.BINDING_INIT, [])
        return
      }
      default:
        logger.trace('chat shell dropped broadcast:', message)
        return
    }
  }

  protected onMessage(message: ChannelMessageData<PopoutMessageDataMap, PopoutMessageType>): void {
    logger.trace('chat shell dropped message:', message)
  }

  private initApp_(app?: YTLiveChatApp): ChatAppMessageChannel | null {
    const { background_, foreground_ } = this
    const { offsetWidth, offsetHeight } = document.body

    if (app == null) {
      // Check if grid can fit more items
      const count = background_.length + foreground_.length
      if (getGridSize(offsetWidth, offsetHeight, count + 1)[2]) return null

      app = document.createElement(YTLiveChatAppTagName) as YTLiveChatApp
    }

    // Create channel for app if needed
    let channel = app[YTLiveChatAppChannel]
    if (channel == null) {
      channel = new ChatAppMessageChannel(this, app, ++this.channelId_)
      background_.push(channel)

      this.setVisibility(channel, true)
    }

    return channel
  }

  private grabApp_(): ChatAppMessageChannel | null {
    const { background_, foreground_ } = this

    return background_[0] ?? foreground_.find(({ boundTo }) => boundTo == null) ?? this.initApp_()
  }

  private resizeGrid_(forced: boolean): void {
    const { foreground_, cols_, rows_ } = this
    const { offsetWidth, offsetHeight } = document.body
    const count = foreground_.length

    // Update overflow flag
    this.full_ = getGridSize(offsetWidth, offsetHeight, count + 1)[2]

    // Resize items if forced or grid size changed
    const [cols, rows] = getGridSize(offsetWidth, offsetHeight, count)
    if (!forced && cols_ === cols && rows_ === rows) return

    logger.debug(`grid resize (${cols}x${rows}) for ${count} items`)

    this.cols_ = cols
    this.rows_ = rows

    // Update foreground items size
    const style = {
      height: `${100 / rows}vh`,
      flexBasis: `${100 / cols}vw`
    } satisfies Partial<CSSStyleDeclaration>

    foreground_.forEach(({ app }) => assign(app.style, style))
  }

  private transfer_(url: string, event?: MouseEvent): boolean {
    const { foreground_ } = this

    // Parse transfer url
    const [href, transferSource, transferKey] = url.split('#', 3)
    const source = Number(transferSource)
    const key = transferKey?.trim()
    if (href !== LiveChatShellUrl || isNaN(source) || !key) return false

    // Ignore transfer from owned channels
    if (foreground_.some(channel => channel.source === source)) return false

    // Find or allocate unbounded chat app
    const channel = this.grabApp_()
    if (channel == null) return false

    logger.debug(`begin popout '${source}' transfer with key '${key}'`)

    // Initiate transfer process
    if (channel.bind(source)) channel.broadcast(PopoutMessageType.POPOUT_TRANSFER, [key])

    // Move chat app to event position
    if (event != null) {
      const { clientX, clientY } = event

      setTimeout(() => this.setPosition(channel, clientX, clientY), 1e3)
    }

    return true
  }

  private update_(): void {
    const { background_, foreground_, full_ } = this

    foreground_.forEach(channel => channel.update())
    if (background_.length === 0 && full_) return

    this.broadcast(PopoutMessageType.POPOUT_ANNOUNCE, [])
  }

  private onDragOver_(event: DragEvent): void {
    event.preventDefault()
  }

  private onDrop_(event: DragEvent): void {
    const { dataTransfer } = event

    const data = dataTransfer?.['getData']('text/plain')
    if (data != null && this.transfer_(data, event)) event.preventDefault()
  }
}

export default class YTChatPopoutModule extends Feature {
  public channel_: MessageChannel<PopoutMessageDataMap, PopoutMessageType> | null = null

  public constructor() {
    super('popout')
  }

  protected activate(): boolean {
    switch (location.pathname) {
      case LiveChatPathname:
      case LiveChatReplayPathname:
        if (location.href.split('#', 1)[0] !== LiveChatShellUrl) return false

        this.channel_ = new ChatShellMessageChannel()
        break
      default:
        this.channel_ = new MainAppMessageChannel()
        break
    }

    return true
  }

  protected deactivate(): boolean {
    this.channel_ = null

    return false
  }
}