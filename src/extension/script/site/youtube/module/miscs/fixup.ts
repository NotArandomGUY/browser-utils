import { defineProperty, getOwnPropertyDescriptor, getOwnPropertyDescriptors, getPrototypeOf, keys } from '@ext/global/object'
import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { removeYTRendererPost, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

const logger = new Logger('YTMISCS-FIXUP')

const filterContentContainer = (data: YTRendererData<YTRenderer<'richItemRenderer' | 'shelfRenderer'>>): boolean => {
  return data.content != null && keys(data.content).length > 0
}

const filterItemsContainer = (data: YTRendererData<YTRenderer<'guideSectionRenderer' | 'horizontalListRenderer' | 'reelShelfRenderer'>>): boolean => {
  return data.items != null && data.items.length > 0
}

const filterShoppingOverlay = (data: YTRendererData<YTRenderer<'shoppingOverlayRenderer'>>): boolean => {
  return data.productsData != null && data.productsData.length > 0
}

export default class YTMiscsFixupModule extends Feature {
  public constructor() {
    super('miscs-fixup')
  }

  protected activate(): boolean {
    removeYTRendererPost(YTRendererSchemaMap['guideSectionRenderer'], filterItemsContainer)
    removeYTRendererPost(YTRendererSchemaMap['horizontalListRenderer'], filterItemsContainer)
    removeYTRendererPost(YTRendererSchemaMap['reelShelfRenderer'], filterItemsContainer)
    removeYTRendererPost(YTRendererSchemaMap['richItemRenderer'], filterContentContainer)
    removeYTRendererPost(YTRendererSchemaMap['shelfRenderer'], filterContentContainer)
    removeYTRendererPost(YTRendererSchemaMap['shoppingOverlayRenderer'], filterShoppingOverlay)

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

    document.addEventListener('DOMContentLoaded', () => {
      const foreignScripts = document.querySelectorAll('script:not([nonce])')
      if (foreignScripts.length === 0) return

      foreignScripts.forEach(script => script.parentNode?.removeChild(script))
      logger.debug(`removed ${foreignScripts.length} foreign scripts`)
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}