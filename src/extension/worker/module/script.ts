import { bufferToString } from '@ext/lib/buffer'
import { Feature } from '@ext/lib/feature'
import Logger from '@ext/lib/logger'
import { ScriptRunAt, ScriptWorld } from '@ext/proto/script/config'
import { getPackageScriptEntry, getPackageScriptIDs, parseOptionalConfig, registerPackageLoadCallback, unregisterPackageLoadCallback } from '@ext/worker/module/package'

import CS = chrome.scripting
import US = chrome.userScripts

const logger = new Logger('WORKER-SCRIPT')

const CONTENT_SCRIPT_CONFIG = {
  allFrames: true,
  matchOriginAsFallback: true,
  matches: ["*://*/*"],
  persistAcrossSessions: true,
  runAt: 'document_start',
  world: 'MAIN'
} satisfies Omit<CS.RegisteredContentScript, 'id'>
const USER_SCRIPT_CONFIG = {
  allFrames: true,
  matches: ["*://*/*"],
  runAt: 'document_start',
  world: 'MAIN'
} satisfies Omit<US.RegisteredUserScript, 'id' | 'js'>
const USER_SCRIPT_FIELDS = ['allFrames', 'excludeGlobs', 'excludeMatches', 'includeGlobs', 'matches', 'runAt', 'world']

const RunAt = {
  [ScriptRunAt.DOCUMENT_START]: 'document_start',
  [ScriptRunAt.DOCUMENT_END]: 'document_end',
  [ScriptRunAt.DOCUMENT_IDLE]: 'document_idle'
} satisfies Record<ScriptRunAt, `${chrome.extensionTypes.RunAt}`>
const UserScriptExecutionWorld = {
  [ScriptWorld.MAIN]: 'MAIN',
  [ScriptWorld.ISOLATED]: 'USER_SCRIPT'
} satisfies Record<ScriptWorld, `${US.ExecutionWorld}`>

const updateContentScripts = (): void => {
  const scripts = [
    {
      ...CONTENT_SCRIPT_CONFIG,
      id: 'preload',
      js: ['preload.js'],
      world: 'ISOLATED'
    }
  ] satisfies CS.RegisteredContentScript[]

  CS.getRegisteredContentScripts().then(registeredScripts => {
    const registerScripts: CS.RegisteredContentScript[] = []
    const updateScripts: CS.RegisteredContentScript[] = []
    const unregisterScripts = registeredScripts.filter(s => scripts.find(({ id }) => id === s.id) == null)

    for (const script of scripts) {
      if (registeredScripts.find(({ id }) => id === script.id) == null) {
        registerScripts.push(script)
      } else {
        updateScripts.push(script)
      }
    }

    logger.info('register/update/unregister content scripts:', registerScripts, updateScripts, unregisterScripts)

    Promise.all([
      registerScripts.length > 0 && CS.registerContentScripts(registerScripts),
      updateScripts.length > 0 && CS.updateContentScripts(updateScripts),
      unregisterScripts.length > 0 && CS.unregisterContentScripts({ ids: unregisterScripts.map(s => s.id) })
    ]).catch(error => {
      logger.error('update content scripts error:', error)
    })
  })
}

const updateUserScripts = async (): Promise<void> => {
  const scripts: US.RegisteredUserScript[] = []

  const packageEntries = (await Promise.all((await getPackageScriptIDs()).map(getPackageScriptEntry))).filter(entry => entry != null)
  const runtimeEntries = packageEntries.splice(0, Math.max(0, packageEntries.findIndex(entry => entry.config != null)))

  if (runtimeEntries.length > 0) {
    scripts.push(
      {
        ...USER_SCRIPT_CONFIG,
        id: 'runtime-isolated',
        js: runtimeEntries.map(entry => entry.code).filter(code => code != null).map(code => ({ code: bufferToString(code) })),
        world: 'USER_SCRIPT'
      },
      {
        ...USER_SCRIPT_CONFIG,
        id: 'runtime-main',
        js: runtimeEntries.map(entry => entry.code).filter(code => code != null).map(code => ({ code: bufferToString(code) }))
      }
    )
  }

  packageEntries.sort((l, r) => (l.config?.priority ?? 0) - (r.config?.priority ?? 0))

  for (const entry of packageEntries) {
    if (entry.config == null) {
      logger.warn(`script '${entry.id}' config invalid`)
      return
    }

    const { dependencies, ...parsed } = parseOptionalConfig(entry.config)

    const js = [
      ...(await Promise.all((dependencies ?? []).map(getPackageScriptEntry))).map(entry => entry?.code)
      , entry.code
    ].filter(code => code != null).map(code => ({ code: bufferToString(code) }))
    if (js.length === 0) {
      logger.warn(`script '${entry.id}' not executable`)
      return
    }

    scripts.push({
      ...USER_SCRIPT_CONFIG,
      ...Object.fromEntries(Object.entries({
        ...parsed,
        runAt: RunAt[parsed.runAt as ScriptRunAt],
        world: UserScriptExecutionWorld[parsed.world as ScriptWorld]
      }).filter(e => USER_SCRIPT_FIELDS.includes(e[0]) && e[1] != null)),
      id: `package-${entry.id}`,
      js
    })
  }

  const registeredScripts = await US.getScripts()

  const registerScripts: US.RegisteredUserScript[] = []
  const updateScripts: US.RegisteredUserScript[] = []
  const unregisterScripts = registeredScripts.filter(s => scripts.find(({ id }) => id === s.id) == null)

  for (const script of scripts) {
    if (registeredScripts.find(({ id }) => id === script.id) == null) {
      registerScripts.push(script)
    } else {
      updateScripts.push(script)
    }
  }

  logger.info('register/update/unregister user scripts:', registerScripts, updateScripts, unregisterScripts)

  Promise.all([
    registerScripts.length > 0 && US.register(registerScripts),
    updateScripts.length > 0 && US.update(updateScripts),
    unregisterScripts.length > 0 && US.unregister({ ids: unregisterScripts.map(s => s.id) })
  ]).catch(error => {
    logger.error('update user scripts error:', error)
  })
}

export default class WorkerInjectorModule extends Feature {
  protected activate(): boolean {
    registerPackageLoadCallback(updateUserScripts)

    chrome.runtime.onInstalled.addListener(updateContentScripts)

    return true
  }

  protected deactivate(): boolean {
    unregisterPackageLoadCallback(updateUserScripts)

    chrome.runtime.onInstalled.removeListener(updateContentScripts)

    CS.getRegisteredContentScripts().then(scripts => CS.unregisterContentScripts({ ids: scripts.map(script => script.id) }))
    US.getScripts().then(scripts => US.unregister({ ids: scripts.map(script => script.id) }))

    return true
  }
}