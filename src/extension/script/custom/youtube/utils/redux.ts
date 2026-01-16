import { getYTLocalEntities, YTLocalEntityData } from '@ext/custom/youtube/utils/local'
import { entries } from '@ext/global/object'
import { waitTick } from '@ext/lib/async'

export const enum YTReduxMethodType {
  GetStore,
  GetManualDownloads,
  GetSmartDownloads
}

const ReduxMethodPatternMap: Record<YTReduxMethodType, [regexp: RegExp, filter?: (fn: Function) => boolean, cache?: [key: string, fn: Function] | null]> = {
  [YTReduxMethodType.GetStore]: [/[a-zA-Z_$][\w$]+\|\|\([a-zA-Z_$][\w$]+=[a-zA-Z_$][\w$]+\(\)\);return [a-zA-Z_$][\w$]+/s, fn => 'store' in fn()],
  [YTReduxMethodType.GetManualDownloads]: [/filter.*?downloadedVideoEntities.*?videoEntity.*?mainDownloadsListEntity.*?sort.*?addedTimestampMillis.*?map/s],
  [YTReduxMethodType.GetSmartDownloads]: [/sort.*?addedTimestampMillis.*?map.*?downloadedVideoEntities.*?filter.*?videoEntity/s]
}

interface YTReduxMethod {
  [YTReduxMethodType.GetStore]: <S extends object>() => YTReduxStore<S>
  [YTReduxMethodType.GetManualDownloads]: () => object[]
  [YTReduxMethodType.GetSmartDownloads]: () => object[]
}

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

export const getYTReduxMethodEntry = <T extends YTReduxMethodType>(type: T): [key: string, fn: YTReduxMethod[T]] | null => {
  const pattern = ReduxMethodPatternMap[type]
  if (pattern == null) return null

  const [regexp, filter, cache] = pattern
  if (cache != null) return cache as ReturnType<typeof getYTReduxMethodEntry<T>>

  const base = window.default_kevlar_base
  if (base == null) return null

  const entry = entries(base).find(([_, v]) => typeof v === 'function' && regexp.test(String(v)) && (filter == null || filter(v))) as [string, Function] ?? null
  pattern[2] = entry

  return entry as ReturnType<typeof getYTReduxMethodEntry<T>>
}

export const getYTReduxStore = async <S extends object = object>(timeout = 15e3): Promise<YTReduxStore<S> | null> => {
  const begin = Date.now()

  do {
    const store = getYTReduxMethodEntry(YTReduxMethodType.GetStore)?.[1]<S>()
    if (store != null) return store

    await waitTick()
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