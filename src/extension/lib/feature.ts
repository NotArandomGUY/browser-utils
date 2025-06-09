import Logger from '@ext/lib/logger'

const logger = new Logger('FEATURE')

const enum FeatureState {
  DISABLED,
  INACTIVE,
  ACTIVE
}

export abstract class Feature {
  private state: FeatureState

  public constructor() {
    this.state = FeatureState.INACTIVE
  }

  public setState(state: FeatureState): boolean {
    try {
      switch (state) {
        case FeatureState.DISABLED:
        case FeatureState.INACTIVE:
          if (this.state === FeatureState.ACTIVE && !this.deactivate()) return false
          break
        case FeatureState.ACTIVE:
          if (this.state !== FeatureState.ACTIVE && !this.activate()) return false
          break
      }
      this.state = state
      return true
    } catch (error) {
      logger.warn(`feature state ${state} error:`, error)
      this.state = FeatureState.DISABLED
      return false
    }
  }

  protected abstract activate(): boolean

  protected abstract deactivate(): boolean
}

export interface FeatureGroup {
  featureMap: Map<number, Feature>
  dependencies: string[]
}

const featureGroupMap = new Map<string, FeatureGroup>()

function activateFeatureGroup(groupId: string): void {
  const group = featureGroupMap.get(groupId)
  if (group == null) {
    logger.warn(`feature group '${groupId}' not found`)
    return
  }

  for (const [featureId, feature] of group.featureMap) {
    if (feature.setState(FeatureState.ACTIVE)) {
      logger.debug(`active feature '${groupId}.${featureId}'`)
    } else {
      logger.debug(`inactive feature '${groupId}.${featureId}'`)
    }
  }
}

function resolveDependencies(depGroupId: string): void {
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

export function registerFeature(group: FeatureGroup, feature: new () => Feature, featureId?: number): void {
  featureId ??= group.featureMap.size
  while (group.featureMap.has(featureId)) featureId++

  group.featureMap.set(featureId, new feature())
}

export function registerFeatureGroup(groupId: string, registerFn: (group: FeatureGroup) => void, dependencies: string[] = []): void {
  if (featureGroupMap.has(groupId)) {
    logger.warn(`duplicate feature group '${groupId}'`)
    return
  }

  // Resolve loaded dependencies
  dependencies = dependencies.filter(dep => !featureGroupMap.has(dep)).map(dep => `'${dep}'`)

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
    logger.trace(`feature group '${groupId}' waiting for dependencies [${dependencies.join(',')}]`)
    return
  }

  // Activate feature group & any dependent feature groups
  activateFeatureGroup(groupId)
  resolveDependencies(groupId)
}