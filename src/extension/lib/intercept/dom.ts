import Hook, { CallContext, HookFn, HookResult, OriginFn } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'

const logger = new Logger('INTERCEPT-DOM')

export default class InterceptDOM {
  /// Public ///

  public static setAppendChildCallback(callback: HookFn<Node, Node[], Node>): void {
    const { hooks, callbacks } = InterceptDOM

    if (hooks.length === 0) {
      Node.prototype.appendChild = InterceptDOM.installAppendHook(Node.prototype.appendChild)
      Node.prototype.insertBefore = InterceptDOM.installAppendHook(Node.prototype.insertBefore)
      Node.prototype.replaceChild = InterceptDOM.installAppendHook(Node.prototype.replaceChild)

      document.createElement = InterceptDOM.installCreateHook(document.createElement)
      document.importNode = InterceptDOM.installCreateHook(document.importNode)
      Node.prototype.cloneNode = InterceptDOM.installCreateHook(Node.prototype.cloneNode)

      logger.debug('dom hooks activated')
    }

    hooks.forEach(hook => hook.install(callback))
    callbacks.push(callback)
  }

  /// Private ///

  private static readonly hooks: Hook<Node, Node[], Node>[] = []
  private static readonly callbacks: HookFn<Node, Node[], Node>[] = []

  private static installCreateHook<A extends unknown[], R extends Node>(fn: (this: Node, ...args: A) => R): (this: Node, ...args: A) => R {
    return new Hook<Node, A, R>(fn).install(ctx => {
      const node = ctx.origin.apply(ctx.self, ctx.args)
      ctx.returnValue = node

      InterceptDOM.onCreateNode(node)

      return HookResult.EXECUTION_CONTINUE
    }).call
  }

  private static installAppendHook<F extends OriginFn<Node, Node[], Node>>(fn: F): F {
    const hook = new Hook(fn)
    InterceptDOM.hooks.push(hook)
    return hook.call as F
  }

  private static onCreateNode(node: Node): void {
    const { callbacks } = InterceptDOM

    if (node instanceof HTMLElement && Object.getOwnPropertyDescriptor(node, 'innerHTML') == null) {
      const { get, set } = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'innerHTML') ?? {}
      Object.defineProperty(node, 'innerHTML', {
        enumerable: true,
        get() {
          return (get ?? node.getHTML).call(node)
        },
        set(v) {
          (set ?? node.setHTMLUnsafe).call(node, v)
          InterceptDOM.onCreateNode(node)
        }
      })
    }

    const childs = node instanceof HTMLTemplateElement ? node.content.childNodes : node.childNodes

    childs.forEach(child => {
      InterceptDOM.onCreateNode(child)

      let result: HookResult = HookResult.EXECUTION_IGNORE

      const ctx: CallContext<Node, Node[], Node> = {
        origin: (...node: Node[]) => {
          result = HookResult.EXECUTION_CONTINUE
          return node[0]
        },
        self: node,
        args: [child],
        returnValue: child
      }

      for (const cb of callbacks) {
        const hookResult = cb(ctx)
        switch (hookResult) {
          case HookResult.EXECUTION_CONTINUE:
          case HookResult.EXECUTION_RETURN:
            result = hookResult
            break
        }
        if (result === HookResult.EXECUTION_RETURN) break
      }

      if (result === HookResult.EXECUTION_IGNORE) return

      child.parentNode?.removeChild(child)
    })
  }
}