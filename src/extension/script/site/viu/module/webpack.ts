import Logger from '@ext/lib/logger'
import { WebpackRuntime, __webpack_runtime_list__, createWebpackRuntimeFromScript, interruptWebpackRuntime } from '@ext/lib/wprt'

const logger = new Logger('VIU-WEBPACK')

const onLoadExportNameCallbackMap: { [name: string]: (obj: object) => void } = {}
const onLoadPropNameCallbackMap: { [name: string]: (obj: object) => void } = {}

function onWebpackLoaderInjected(loaderList: WebpackRuntime[]): void {
  const loader = loaderList[0]
  if (loader == null) {
    logger.warn('failed to inject loader')
    return
  }

  window['__webpack_runtime_list__'] = __webpack_runtime_list__

  loader.onModuleLoadedCallback = (module) => {
    const { exports } = module
    if (exports == null || typeof exports !== 'object') return

    for (const exportName in exports) {
      if (onLoadExportNameCallbackMap[exportName] != null) return onLoadExportNameCallbackMap[exportName](exports)

      const value = (<any>exports)[exportName]
      if (value == null || typeof value !== 'object') continue

      for (const propName in value) {
        if (onLoadPropNameCallbackMap[propName] != null) return onLoadPropNameCallbackMap[propName](value)
      }
    }
  }
}

export function loadWebpackObjectByExportName<T extends object>(name: string, callback: (obj: T) => void): void {
  onLoadExportNameCallbackMap[name] = <(obj: object) => void>callback
}

export function loadWebpackObjectByPropName<T extends object>(name: string, callback: (obj: T) => void): void {
  onLoadPropNameCallbackMap[name] = <(obj: object) => void>callback
}

export default function initViuWebpackModule(): void {
  interruptWebpackRuntime(chunkLoadingGlobal => ['bitmovin_player', 'jwplayer'].includes(chunkLoadingGlobal.slice(12)))

  window.addEventListener('load', () => {
    const webpackChunk = document.querySelector<HTMLScriptElement>('script[src*="chunks/webpack"]')
    if (webpackChunk == null) return

    const webpackUrl = webpackChunk.src
    logger.info('initialize webpack runtime with loader:', webpackUrl)

    webpackChunk.src = ''
    webpackChunk.parentElement?.removeChild(webpackChunk)

    fetch(webpackUrl, { method: 'GET' }).then(async (rsp) => {
      createWebpackRuntimeFromScript(await rsp.text())
      onWebpackLoaderInjected(__webpack_runtime_list__)
    })
  })
}
