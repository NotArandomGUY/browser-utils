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

export function registerFeature(group: FeatureGroup, feature: new () => Feature, featureId?: number): void {
  featureId ??= group.featureMap.size
  while (group.featureMap.has(featureId)) featureId++

  group.featureMap.set(featureId, new feature())
}

export function registerFeatureGroup(groupId: string, registerFn: (group: FeatureGroup) => void): void {
  const group: FeatureGroup = {
    featureMap: new Map()
  }
  featureGroupMap.set(groupId, group)

  try {
    registerFn(group)
    logger.info(`registered feature group '${groupId}'`)
  } catch (error) {
    logger.warn(`register feature group '${groupId}' error:`, error)
  }

  activateFeatureGroup(groupId)
}