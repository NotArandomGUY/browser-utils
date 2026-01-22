import { getYTLocalEntities, ReverseEntityType, YTLocalEntityData } from '@ext/custom/youtube/utils/local'

export const enum YTReduxMethodType {
  GetStore,
  GetAllDownloads,
  GetManualDownloads,
  GetSmartDownloads
}

export type YTReduxEntities = {
  [T in keyof YTLocalEntityData as ReverseEntityType[T]]: Record<string, YTLocalEntityData[T]>
}

interface YTReduxMethod {
  [YTReduxMethodType.GetStore]: () => YTReduxStore
  [YTReduxMethodType.GetAllDownloads]: (entities: YTReduxEntities) => object[]
  [YTReduxMethodType.GetManualDownloads]: (entities: YTReduxEntities) => object[]
  [YTReduxMethodType.GetSmartDownloads]: (entities: YTReduxEntities) => object[]
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

const reduxMethods = new Map<YTReduxMethodType, (...args: unknown[]) => unknown>()

export const defineYTReduxMethod = (type: YTReduxMethodType, fn: (...args: unknown[]) => unknown): void => {
  reduxMethods.set(type, fn)
}

export const invokeYTReduxMethod = <T extends YTReduxMethodType>(type: T, ...args: Parameters<YTReduxMethod[T]>): ReturnType<YTReduxMethod[T]> | null => {
  return reduxMethods.get(type)?.(...args) as ReturnType<YTReduxMethod[T]> ?? null
}

export const updateYTReduxStoreLocalEntities = async (): Promise<void> => {
  const store = invokeYTReduxMethod(YTReduxMethodType.GetStore)
  if (store == null) throw new Error('invalid store')

  const payload: Record<string, Record<string, YTLocalEntityData[keyof YTLocalEntityData]>> = {}
  const entities = await getYTLocalEntities(true)

  for (const { key, entityType, data } of entities) {
    payload[entityType] ??= {}
    payload[entityType][key] = data
  }

  store.dispatch({ type: 'REPLACE_ENTITIES', payload })
}