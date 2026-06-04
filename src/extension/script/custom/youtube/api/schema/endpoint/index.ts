import * as renderer from '../renderer'
import * as components from './components'
import * as raw_mapped from './mapped'

export * as components from './components'
export * as enums from './enums'

export type ComponentKey = keyof typeof components
export type Component<K extends ComponentKey = ComponentKey> = typeof components[K]
export type MappedKey = keyof typeof mapped
export type Mapped<K extends MappedKey = MappedKey> = typeof mapped[K]

export const mapped = { ...renderer.components.SchemaBase, ...raw_mapped } as const

export const MappedOuterKeys = new Set<MappedKey>([
  'clickTrackingParams',
  'commandMetadata',
  'loggingUrls'
])