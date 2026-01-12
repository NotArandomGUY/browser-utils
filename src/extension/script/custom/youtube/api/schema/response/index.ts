import * as components from './components'
import * as mapped from './mapped'

export * as components from './components'
export * as mapped from './mapped'

export type ComponentKey = keyof typeof components
export type Component<K extends ComponentKey = ComponentKey> = typeof components[K]
export type MappedKey = keyof typeof mapped
export type Mapped<K extends MappedKey = MappedKey> = typeof mapped[K]