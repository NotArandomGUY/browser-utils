import Logger from '@ext/lib/logger'
import { DEFAULT_SCRIPT_CONFIG, SITE_SCRIPT_CONFIG } from '@virtual/script-config'

const logger = new Logger('WORKER-INJECTOR')

const RUNTIME_PATHS = [
  'js/runtime.js',
  'js/vendor.js'
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

function registerContentScripts(): void {
  logger.info('registering content scripts...')

  const excludeMatches = SITE_SCRIPT_CONFIG.filter(config => config.preventDefault).flatMap(site => site.matches ?? [])
  const siteScripts = SITE_SCRIPT_CONFIG.map(config => {
    const path = `js/site/${getScriptName(config.script)}.js`

    return {
      ...CONTENT_SCRIPT_CONFIG,
      id: config.script,
      matchOriginAsFallback: config.matches?.find(m => !MATCH_ORIGIN_REGEXP.test(m)) == null,
      js: config.preventDefault ? [...RUNTIME_PATHS, path] : [path],
      matches: config.matches
    }
  }) satisfies chrome.scripting.RegisteredContentScript[]

  logger.debug('default exclude matches:', excludeMatches)
  logger.debug('site content scripts:', siteScripts)

  chrome.scripting.registerContentScripts([
    {
      ...CONTENT_SCRIPT_CONFIG,
      id: 'default',
      matchOriginAsFallback: true,
      excludeMatches,
      js: [
        ...RUNTIME_PATHS,
        ...DEFAULT_SCRIPT_CONFIG.map(config => `js/default/${getScriptName(config.script)}.js`)
      ]
    },
    ...siteScripts
  ], () => {
    chrome.scripting.getRegisteredContentScripts(scripts => logger.info('registered content scripts:', scripts))
  })
}

export default function initWorkerInjectorModule(): void {
  chrome.scripting.getRegisteredContentScripts(scripts => chrome.scripting.unregisterContentScripts({ ids: scripts.map(script => script.id) }, registerContentScripts))
}