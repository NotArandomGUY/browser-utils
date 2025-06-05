import { compress, decompress } from 'lz-string'

const LOCAL_STORAGE_ID = 'bu-watch-history-v1'
const SESSION_STORAGE_ID = 'bu-product-data-cache-v1'
const API_HOST = 'api-gateway-global.viu.com'

interface WatchHistory {
  productIds: string
  languageFlagId: number
  areaId: number
}

let productDataCache: { [id: string]: object } = {}

async function historyToApi(history: WatchHistory): Promise<[object | null, boolean]> {
  const { productIds, languageFlagId, areaId } = history

  // Try to find cached product data
  let productData = productDataCache[productIds] ?? null
  if (productData != null) return [productData, true]

  try {
    // Construct search params
    const search = new URLSearchParams({
      platform_flag_label: 'web', area_id: String(areaId), language_flag_id: String(languageFlagId),
      platformFlagLabel: 'web', areaId: String(areaId), languageFlagId: String(languageFlagId),
      countryCode: 'HK', ut: '3',
      r: '/vod/detail',
      product_id: String(productIds),
      os_flag_id: '1'
    })

    // Fetch vod detail api
    const { status, data } = await (await fetch(`https://${API_HOST}/api/mobile?${search.toString()}`)).json()
    if (status?.code !== 0) throw new Error('bad status')

    // Construct product data from response
    productData = { ...data.series, ...data.current_product }

    // Save cache
    productDataCache[productIds] = productData

    // Return product data
    return [productData, false]
  } catch (err) {
    console.warn(err)
    return [null, false]
  }
}

async function getWatchHistory(): Promise<object> {
  // Read history data
  let data: WatchHistory[]
  try {
    data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID) ?? '[]')
  } catch {
    data = []
  }

  // Load product data cache
  try {
    productDataCache = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_ID) ?? '{}')
  } catch {
    productDataCache = {}
  }

  // Convert all entries to api response
  const entries: object[] = []
  let fetchedEntries = 0
  for (const history of data) {
    const [entry, isCached] = await historyToApi(history)
    if (entry == null) continue

    entries.push(entry)

    if (!isCached && ++fetchedEntries >= 15) break
  }

  // Write product data cache
  sessionStorage.setItem(SESSION_STORAGE_ID, JSON.stringify(productDataCache))

  return {
    tv: entries,
    movie: []
  }
}

function postWatchHistory(history: WatchHistory): void {
  const productId = parseInt(history.productIds)
  if (isNaN(productId)) return

  // Read history data
  let data: WatchHistory[]
  try {
    data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID) ?? '[]')
  } catch {
    data = []
  }

  // Update history data
  data.unshift(history)

  // Deduplicate
  const existsIdList: string[] = []
  for (let i = 0; i < data.length; i++) {
    const history = data[i]
    if (!existsIdList.includes(history.productIds)) {
      existsIdList.push(history.productIds)
      continue
    }
    data.splice(i, 1)
  }

  // Write history data
  localStorage.setItem(LOCAL_STORAGE_ID, JSON.stringify(data))
}

export function ViuLSImportHistory(data: string): void {
  localStorage.setItem(LOCAL_STORAGE_ID, decompress(data))
}

export function ViuLSExportHistory(): string {
  return compress(localStorage.getItem(LOCAL_STORAGE_ID) ?? '')
}

export default async function ViuLSHandleHistory(method: string, _url: URL, body: string): Promise<object> {
  let rsp = {}
  switch (method) {
    case 'GET':
      rsp = await getWatchHistory()
      break
    case 'POST':
      postWatchHistory(JSON.parse(body))
      break
  }
  return rsp
}
