import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { DEFAULT_SCRIPT_CONFIG, SITE_SCRIPT_CONFIG } from '@virtual/script-config'

const logger = new Logger('WORKER-INJECTOR')

const RUNTIME_PATHS = [
  'js/runtime.js',
  'js/vendor.js',
  'js/preload/main.js'
]

const MATCH_ORIGIN_REGEXP = /^.+?:\/\/[^/]+?\/\*$/
const CONTENT_SCRIPT_CONFIG = {
  allFrames: true,
  matches: ["*://*/*"],
  persistAcrossSessions: false,
  runAt: 'document_start',
  world: 'MAIN'
} satisfies Omit<chrome.scripting.RegisteredContentScript, 'id'>

function getScriptName(script: string): string {
  return script.replace(/[./]/g, '_')
}

export default class WorkerInjectorModule extends Feature {
  protected activate(): boolean {
    logger.info('registering content scripts...')

    const excludeMatches = SITE_SCRIPT_CONFIG.filter(config => config.preventDefault).flatMap(site => site.matches ?? [])

    logger.debug('exclude matches:', excludeMatches)

    const scripts = [
      {
        ...CONTENT_SCRIPT_CONFIG,
        id: 'isolated-preload',
        matchOriginAsFallback: true,
        js: ['js/preload/isolated.js'],
        world: 'ISOLATED'
      },
      {
        ...CONTENT_SCRIPT_CONFIG,
        id: 'main-default',
        matchOriginAsFallback: true,
        excludeMatches,
        js: [
          ...RUNTIME_PATHS,
          ...DEFAULT_SCRIPT_CONFIG.map(config => `js/default/${getScriptName(config.script)}.js`)
        ]
      },
      ...SITE_SCRIPT_CONFIG.map(config => {
        const path = `js/site/${getScriptName(config.script)}.js`

        return {
          ...CONTENT_SCRIPT_CONFIG,
          id: `main-${config.script}`,
          matchOriginAsFallback: config.matches?.find(m => !MATCH_ORIGIN_REGEXP.test(m)) == null,
          js: config.preventDefault ? [...RUNTIME_PATHS, path] : [path],
          matches: config.matches
        }
      })
    ] satisfies chrome.scripting.RegisteredContentScript[]

    chrome.scripting.getRegisteredContentScripts(registeredScripts => {
      const registerScripts: chrome.scripting.RegisteredContentScript[] = []
      const updateScripts: chrome.scripting.RegisteredContentScript[] = []
      const unregisterScripts = registeredScripts.filter(s => scripts.find(({ id }) => id === s.id) == null)

      for (const script of scripts) {
        if (registeredScripts.find(({ id }) => id === script.id) == null) {
          registerScripts.push(script)
        } else {
          updateScripts.push(script)
        }
      }

      logger.debug('register/update/unregister content scripts:', registerScripts, updateScripts, unregisterScripts)

      Promise.all([
        registerScripts.length > 0 && chrome.scripting.registerContentScripts(registerScripts),
        updateScripts.length > 0 && chrome.scripting.updateContentScripts(updateScripts),
        unregisterScripts.length > 0 && chrome.scripting.unregisterContentScripts({ ids: unregisterScripts.map(s => s.id) })
      ]).then(() => {
        logger.info('updated content scripts')
      }).catch(error => {
        logger.error('update content scripts error:', error)
      })
    })

    return true
  }

  protected deactivate(): boolean {
    chrome.scripting.getRegisteredContentScripts(registeredScripts => {
      chrome.scripting.unregisterContentScripts({ ids: registeredScripts.map(s => s.id) })
    })

    return true
  }
}