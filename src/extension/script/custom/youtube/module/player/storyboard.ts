import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { YTPInstanceType, YTPlayerInstanceCreateCallback, YTPVideoDataInstance } from '@ext/custom/youtube/module/player/bootstrap'
import { max } from '@ext/global/math'
import { defineProperty, getOwnPropertyNames, getPrototypeOf } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import Hook, { HookResult } from '@ext/lib/intercept/hook'

const updatePlayerResponse = ({ storyboards, streamingData }: YTValueData<YTResponse.Mapped<'player'>>): void => {
  const storyboard = storyboards?.playerLiveStoryboardSpecRenderer ?? storyboards?.playerStoryboardSpecRenderer
  const formats = streamingData?.adaptiveFormats ?? streamingData?.formats
  if (storyboard == null || formats == null) return

  const specs = storyboard.spec?.split('|').map(spec => spec.split('#'))
  const ratio = formats.map(format => (format.width ?? 0) / (format.height ?? 0)).find(ratio => !isNaN(ratio))
  if (specs == null || !ratio) return

  if ('playerLiveStoryboardSpecRenderer' in storyboards!) {
    const spec = specs[0]
    const [w, h, c, r] = spec.slice(1).map(Number)

    const size = max(w, h)
    if (isNaN(size)) return

    storyboard.spec = [spec[0], ratio > 1 ? size : (size * ratio), ratio > 1 ? (size / ratio) : size, c, r].join('#')
    return
  }

  storyboard.spec = specs.map(spec => {
    const [w, h, f, c, r, d] = spec.slice(0, 6).map(Number)

    const size = max(w, h)
    if (isNaN(size)) return spec

    return [ratio > 1 ? size : (size * ratio), ratio > 1 ? (size / ratio) : size, f, c, r, d, ...spec.slice(6)].join('#')
  }).join('|')
}

export default class YTPlayerStoryboardModule extends Feature {
  public constructor() {
    super('storyboard')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      YTPlayerInstanceCreateCallback.registerCallback((type, instance) => {
        if (type !== YTPInstanceType.VIDEO_PLAYER) return

        const prototype = getPrototypeOf(instance.videoData)
        if (prototype == null) return

        getOwnPropertyNames(prototype).forEach(key => {
          const value = prototype[key as keyof YTPVideoDataInstance]
          if (typeof value !== 'function' || !value.toString().includes('.storyboards')) return

          defineProperty(instance.videoData, key, {
            configurable: true,
            value: new Hook(value as (this: YTPVideoDataInstance, ...args: unknown[]) => unknown).install(ctx => {
              const { self, args } = ctx

              const cotn = self.cotn
              self.cotn = undefined
              ctx.returnValue = ctx.origin.apply(self, args)
              self.cotn = cotn

              return HookResult.EXECUTION_RETURN
            }).call
          })
        })
      }),
      registerYTValueProcessor(YTResponse.mapped.player, updatePlayerResponse)
    )

    return true
  }
}