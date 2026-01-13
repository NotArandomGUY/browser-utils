import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { defineProperty, getOwnPropertyDescriptor } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import { preventDispatchEvent } from '@ext/lib/intercept/event'
import { HookResult } from '@ext/lib/intercept/hook'
import InterceptImage from '@ext/lib/intercept/image'

const { Image } = window

const THUMBNAIL_TEST_TIMEOUT = 1e3
const THUMBNAIL_404_WIDTH = 120
const THUMBNAIL_URL_REGEXP = /\.ytimg\.com\/vi\//
const CSS_STYLE_PROTO = CSSStyleDeclaration.prototype

const getMaxResUrl = (url: string): string => {
  return url.replace(/(?<=\/)hq(?=(default|\d)\.)/, 'maxres').replace(/\?.*$/, '')
}

const testThumbnail = (src: string) => new Promise<boolean>(resolve => {
  const img = new Image()
  const timer = setTimeout(() => img.src = '', THUMBNAIL_TEST_TIMEOUT)

  img.onload = () => {
    clearTimeout(timer)
    resolve(img.naturalWidth !== THUMBNAIL_404_WIDTH)
  }
  img.onerror = img.onabort = () => {
    clearTimeout(timer)
    resolve(false)
  }
  img.src = src
})

const updateThumbnails = async (data?: YTValueData<YTRenderer.Component<'thumbnail'>>): Promise<void> => {
  const thumbnails = data?.thumbnails
  if (!Array.isArray(thumbnails)) return

  for (const thumbnail of thumbnails) {
    const { url } = thumbnail
    if (url == null) continue

    const maxresUrl = getMaxResUrl(url)
    if (!await testThumbnail(maxresUrl)) continue

    thumbnail.url = maxresUrl
  }
}

const updateSetAppBackgroundCommand = async (data: YTValueData<YTEndpoint.Mapped<'setAppBackgroundCommand'>>): Promise<boolean> => {
  await updateThumbnails(data.image)
  return true
}

const updateLiveStreamOfflineSlateRenderer = async (data: YTValueData<YTRenderer.Mapped<'liveStreamOfflineSlateRenderer'>>): Promise<boolean> => {
  await updateThumbnails(data.thumbnail)
  return true
}

export default class YTMiscsThumbnailModule extends Feature {
  public constructor() {
    super('thumbnail')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTEndpoint.mapped.setAppBackgroundCommand, updateSetAppBackgroundCommand)
    registerYTValueProcessor(YTRenderer.mapped.liveStreamOfflineSlateRenderer, updateLiveStreamOfflineSlateRenderer)

    const descriptor = getOwnPropertyDescriptor(CSS_STYLE_PROTO, 'cssText')
    if (descriptor?.set != null) {
      const setCssText = descriptor.set

      defineProperty(CSS_STYLE_PROTO, 'cssText', {
        ...descriptor,
        set(cssText) {
          if (typeof cssText !== 'string') return setCssText.call(this, cssText)

          const originalUrl = /(?<=url\(.).*?(?=.\))/.exec(cssText)?.[0]
          if (originalUrl == null || !THUMBNAIL_URL_REGEXP.test(originalUrl)) return setCssText.call(this, cssText)

          const maxresUrl = getMaxResUrl(originalUrl)
          testThumbnail(maxresUrl).then(success => {
            if (success) cssText = cssText.replace(originalUrl, maxresUrl)
            setCssText.call(this, cssText)
          })
        }
      })
    }

    InterceptImage.setCallback((type, event) => {
      if (type !== 'srcchange' || !event.cancelable) return

      const originalUrl = String((<CustomEvent<string>>event).detail)
      if (!THUMBNAIL_URL_REGEXP.test(originalUrl)) return

      preventDispatchEvent(event)

      const maxresUrl = getMaxResUrl(originalUrl)
      testThumbnail(maxresUrl).then(success => {
        event.target?.dispatchEvent(new CustomEvent('srcchange', { detail: success ? maxresUrl : originalUrl }))
      })

      return HookResult.EXECUTION_PASSTHROUGH
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}