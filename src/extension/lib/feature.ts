import { floor } from '@ext/global/math'
import { fromEntries } from '@ext/global/object'
import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import Logger from '@ext/lib/logger'

const logger = new Logger('FEATURE')

const DMASK_STORAGE_KEY = 'bufeature-dmask'

const kiName = Symbol()
const kiState = Symbol()
const kiCleanupCallbacks = Symbol()

export const enum FeatureState {
  DISABLED,
  INACTIVE,
  ACTIVE
}

export abstract class Feature {
  private readonly [kiName]: string | null
  private [kiState]: FeatureState
  private readonly [kiCleanupCallbacks]: Function[]

  public constructor(name?: string) {
    this[kiName] = name ?? null
    this[kiState] = FeatureState.INACTIVE
    this[kiCleanupCallbacks] = []
  }

  public getName(): string | null {
    return this[kiName]
  }

  public getState(): FeatureState {
    return this[kiState]
  }

  public setState(state: FeatureState): boolean {
    try {
      switch (state) {
        case FeatureState.DISABLED:
        case FeatureState.INACTIVE:
          if (this[kiState] === FeatureState.ACTIVE && !this.deactivate()) return false
          break
        case FeatureState.ACTIVE:
          if (this[kiState] !== FeatureState.ACTIVE && !this.activate(this[kiCleanupCallbacks])) return false
          break
      }
      this[kiState] = state
      return true
    } catch (error) {
      logger.warn(`feature state ${state} error:`, error)
      this[kiState] = FeatureState.DISABLED
      return false
    }
  }

  protected abstract activate(cleanupCallbacks: Function[]): boolean

  protected deactivate(): boolean {
    this[kiCleanupCallbacks].forEach(callback => callback())

    return true
  }
}

export interface FeatureGroup {
  featureMap: Map<number, Feature>
  dependencies: string[]
}

const featureGroupMap = new Map<string, FeatureGroup>()

let disableMaskMap: Map<string, Uint8Array> | null = null

const activateFeatureGroup = (groupId: string): void => {
  const group = featureGroupMap.get(groupId)
  if (group == null) {
    logger.warn(`feature group '${groupId}' not found`)
    return
  }

  const disableMask = getFeatureGroupDisableMask(groupId)
  const isGroupDisabled = disableMask.length > 0 && (disableMask[0] & 1) !== 0

  const begin = performance.now()
  const steps: number[] = []

  let isReload = false

  for (const [featureId, feature] of group.featureMap) {
    const disableMaskByte = disableMask[floor((featureId + 1) / 8)] ?? 0
    const isDisabled = isGroupDisabled || (disableMaskByte & (1 << ((featureId + 1) % 8))) !== 0

    if (isDisabled) {
      isReload = !feature.setState(FeatureState.DISABLED) || isReload
      logger.debug(`disable feature '${groupId}.${featureId}'`)
      continue
    }

    if (feature.setState(FeatureState.ACTIVE)) {
      logger.debug(`active feature '${groupId}.${featureId}'`)
    } else {
      logger.debug(`inactive feature '${groupId}.${featureId}'`)
    }

    steps.push(performance.now())
  }

  logger.debug(`feature group '${groupId}' activation performance:`, steps.map((step, i) => [step - (steps[i - 1] ?? begin), step - begin]))

  if (isReload) location.reload()
}

const resolveDependencies = (depGroupId: string): void => {
  for (const [groupId, group] of featureGroupMap) {
    const index = group.dependencies.indexOf(depGroupId)
    if (index < 0) continue

    // Remove loaded dependency from group entry
    group.dependencies.splice(index, 1)
    if (group.dependencies.length > 0) continue

    // Activate feature group & any dependent feature groups after all dependencies are resolved
    activateFeatureGroup(groupId)
    resolveDependencies(groupId)
  }
}

export const getAllFeatureGroupDisableMask = (): Record<string, Uint8Array> => {
  if (disableMaskMap == null) {
    try {
      const decoded = JSON.parse(globalThis.localStorage.getItem(DMASK_STORAGE_KEY) ?? '')

      disableMaskMap = new Map()

      for (const groupId in decoded) {
        disableMaskMap.set(groupId, bufferFromString(String(decoded[groupId]), 'base64'))
      }
    } catch {
      disableMaskMap = new Map()
    }
  }

  return fromEntries(disableMaskMap.entries())
}

export const getFeatureGroupDisableMask = (groupId: string): Uint8Array => {
  return getAllFeatureGroupDisableMask()[groupId] ?? new Uint8Array(0)
}

export const batchSetFeatureGroupDisableMask = (masks: Record<string, Uint8Array>): void => {
  try {
    disableMaskMap ??= new Map()

    for (const groupId in masks) {
      const mask = masks[groupId]
      if (mask.findIndex(b => b !== 0) >= 0) {
        disableMaskMap.set(groupId, mask)
      } else {
        disableMaskMap.delete(groupId)
      }
      activateFeatureGroup(groupId)
    }

    const { localStorage } = globalThis

    if (disableMaskMap.size === 0) {
      localStorage.removeItem(DMASK_STORAGE_KEY)
      return
    }

    localStorage.setItem(DMASK_STORAGE_KEY, JSON.stringify(fromEntries(Array.from(disableMaskMap.entries()).map(e => [e[0], btoa(bufferToString(e[1]))]))))
  } catch {
    // NOOP
  }
}

export const setFeatureGroupDisableMask = (groupId: string, mask: Uint8Array): void => {
  batchSetFeatureGroupDisableMask({ [groupId]: mask })
}

export const getAllFeatureGroup = (): Record<string, FeatureGroup> => {
  return fromEntries(featureGroupMap.entries())
}

export const getFeatureGroup = (groupId: string): FeatureGroup | null => {
  return featureGroupMap.get(groupId) ?? null
}

export const registerFeature = (group: FeatureGroup, feature: new () => Feature, featureId?: number): void => {
  featureId ??= group.featureMap.size
  while (group.featureMap.has(featureId)) featureId++

  group.featureMap.set(featureId, new feature())
}

export const registerFeatureGroup = (groupId: string, registerFn: (group: FeatureGroup) => void, dependencies: string[] = []): void => {
  if (featureGroupMap.has(groupId)) {
    logger.warn(`duplicate feature group '${groupId}'`)
    return
  }

  // Resolve loaded dependencies
  dependencies = dependencies.filter(dep => !featureGroupMap.has(dep))

  // Create feature group
  const group: FeatureGroup = {
    featureMap: new Map(),
    dependencies
  }
  featureGroupMap.set(groupId, group)

  try {
    registerFn(group)
    logger.info(`registered feature group '${groupId}'`)
  } catch (error) {
    logger.warn(`register feature group '${groupId}' error:`, error)
  }

  // Skip activation if there's missing dependencies
  if (dependencies.length > 0) {
    logger.trace(`feature group '${groupId}' waiting for dependencies [${dependencies.map(dep => `'${dep}'`).join(',')}]`)
    return
  }

  // Activate feature group & any dependent feature groups
  activateFeatureGroup(groupId)
  resolveDependencies(groupId)
}