import Logger from '@ext/lib/logger'

const logger = new Logger('VIU-LS-UPDATE')

const LOCAL_STORAGE_UPDATE_MAP: { [key: string]: (data: string) => [string, string] } = {
  'td-watch-history': (data) => [
    'bu-watch-history-v1',
    data
  ],
  'td-watch-timeline': (data) => [
    'bu-watch-timeline-v1',
    data
  ]
}

function taskUpdateLocalStorage(): void {
  for (const key in LOCAL_STORAGE_UPDATE_MAP) {
    const data = localStorage.getItem(key)
    if (data == null) continue

    try {
      const [newKey, newData] = LOCAL_STORAGE_UPDATE_MAP[key](data)

      logger.info('update local storage', key, '->', newKey)

      localStorage.removeItem(key)
      localStorage.setItem(newKey, newData)
    } catch (err) {
      logger.error(err)
      localStorage.setItem(key, data)
    }
  }
}

export default function ViuLSApplyUpdate(): void {
  taskUpdateLocalStorage()
}
