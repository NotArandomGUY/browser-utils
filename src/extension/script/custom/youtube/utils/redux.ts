import { getYTLocalEntities, YTLocalEntityData } from '@ext/custom/youtube/utils/local'
import { values } from '@ext/global/object'
import { waitTick } from '@ext/lib/async'

const REDUX_STORE_GETTER_REGEXP = /[a-zA-Z_$][\w$]+\|\|\([a-zA-Z_$][\w$]+=[a-zA-Z_$][\w$]+\(\)\);return [a-zA-Z_$][\w$]+/

interface YTReduxAction<T = unknown> {
  type: string
  payload: T
}

interface YTReduxStore<S extends object = object> {
  dispatch(action: YTReduxAction): void
  getState(): S
  replaceReducer(nextReducer: (state: S, action: YTReduxAction) => S): void
  subscribe(listener: () => void): void
}

export const getYTReduxStore = async <S extends object = object>(timeout = 15e3): Promise<YTReduxStore<S> | null> => {
  const begin = Date.now()

  do {
    await waitTick()

    const base = window.default_kevlar_base
    if (base == null) continue

    const getter = values(base).find(v => typeof v === 'function' && REDUX_STORE_GETTER_REGEXP.test(String(v)) && 'store' in v()) as () => YTReduxStore<S>

    const store = getter?.()
    if (store != null) return store
  } while ((Date.now() - begin) < timeout)

  return null
}

export const updateYTReduxStoreLocalEntities = async (timeout?: number): Promise<void> => {
  const store = await getYTReduxStore(timeout)
  if (store == null) return

  const payload: Record<string, Record<string, YTLocalEntityData[keyof YTLocalEntityData]>> = {}
  const entities = await getYTLocalEntities(true)

  for (const { key, entityType, data } of entities) {
    payload[entityType] ??= {}
    payload[entityType][key] = data
  }

  store.dispatch({ type: 'REPLACE_ENTITIES', payload })
}