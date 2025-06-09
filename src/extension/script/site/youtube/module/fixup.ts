import { Feature } from '@ext/lib/feature'
import InterceptDOM from '@ext/lib/intercept/dom'
import { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { removeYTRendererPost, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'

const logger = new Logger('YT-FIXUP')

function filterContentContainer(data: YTRendererData<YTRenderer<'richItemRenderer'>>): boolean {
  return data.content != null && Object.keys(data.content).length > 0
}

function filterItemsContainer(data: YTRendererData<YTRenderer<'guideSectionRenderer' | 'reelShelfRenderer'>>): boolean {
  return data.items != null && data.items.length > 0
}

export default class YTFixupModule extends Feature {
  protected activate(): boolean {
    removeYTRendererPost(YTRendererSchemaMap['guideSectionRenderer'], filterItemsContainer)
    removeYTRendererPost(YTRendererSchemaMap['reelShelfRenderer'], filterItemsContainer)
    removeYTRendererPost(YTRendererSchemaMap['richItemRenderer'], filterContentContainer)

    InterceptDOM.setAppendChildCallback(ctx => {
      const node = ctx.args[0]

      if (node instanceof HTMLIFrameElement && Object.getOwnPropertyDescriptor(node, 'contentDocument') == null) {
        // Make yt fallback to using src property instead
        const { get } = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'contentDocument') ?? {}
        Object.defineProperty(node, 'contentDocument', {
          get() {
            const contentDocument: Document = get?.call(node)
            if (contentDocument == null || contentDocument.location.href === 'about:blank') return null

            return contentDocument
          }
        })
        if (node.sandbox.length > 0) node.sandbox.add('allow-same-origin', 'allow-scripts')

        logger.debug('patched iframe element', node, Object.getOwnPropertyDescriptors(node))
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