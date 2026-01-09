import { removeYTRendererPost, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { defineProperty, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getPrototypeOf, keys } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('YTMISCS-FIXUP')

const stopControlEvent = (event: Event): void => {
  const { target } = event

  if (target instanceof Element && document.querySelector('.bu-overlay')?.contains(target)) {
    event.stopImmediatePropagation()
  }
}

const createArrayFilter = <K extends string>(key: K): (data: { [P in K]?: unknown[] }) => boolean => {
  return data => Array.isArray(data[key]) && data[key].length > 0
}

const createObjectFilter = <K extends string>(key: K): (data: { [P in K]?: Record<string, unknown> }) => boolean => {
  return data => data[key] != null && keys(data[key]).length > 0
}

const filterContent = createObjectFilter('content')
const filterContents = createArrayFilter('contents')
const filterItems = createArrayFilter('items')
const filterProductsData = createArrayFilter('productsData')

export default class YTMiscsFixupModule extends Feature {
  public constructor() {
    super('fixup')
  }

  protected activate(): boolean {
    removeYTRendererPost(YTRendererSchemaMap['gridShelfViewModel'], filterContents)
    removeYTRendererPost(YTRendererSchemaMap['guideSectionRenderer'], filterItems)
    removeYTRendererPost(YTRendererSchemaMap['horizontalListRenderer'], filterItems)
    removeYTRendererPost(YTRendererSchemaMap['reelShelfRenderer'], filterItems)
    removeYTRendererPost(YTRendererSchemaMap['richItemRenderer'], filterContent)
    removeYTRendererPost(YTRendererSchemaMap['shelfRenderer'], filterContent)
    removeYTRendererPost(YTRendererSchemaMap['shoppingOverlayRenderer'], filterProductsData)

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      if (node instanceof HTMLIFrameElement && getOwnPropertyDescriptor(node, 'contentDocument') == null) {
        // Make yt fallback to using src property instead
        const { get } = getOwnPropertyDescriptor(getPrototypeOf(node), 'contentDocument') ?? {}
        defineProperty(node, 'contentDocument', {
          get() {
            const contentDocument: Document = get?.call(node)
            if (contentDocument == null || contentDocument.location.href === 'about:blank') return null

            return contentDocument
          }
        })
        if (node.sandbox.length > 0) node.sandbox.add('allow-same-origin', 'allow-scripts')

        logger.debug('patched iframe element', node, getOwnPropertyDescriptors(node))
      }

      return HookResult.EXECUTION_IGNORE
    })

    addEventListener('mousedown', stopControlEvent, true)
    addEventListener('keydown', stopControlEvent, true)
    addEventListener('scroll', stopControlEvent, true)

    document.addEventListener('DOMContentLoaded', () => {
      const foreignScripts = document.querySelectorAll('script:not([nonce])')
      if (foreignScripts.length === 0) return

      foreignScripts.forEach(script => script.remove())
      logger.debug(`removed ${foreignScripts.length} foreign scripts`)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}