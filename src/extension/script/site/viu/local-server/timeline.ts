import { compress, decompress } from 'lz-string'

const LOCAL_STORAGE_ID = 'bu-watch-timeline-v1'

interface WatchTimeLine {
  productId: string
  contentId: string
  contentTitle: string
  playTime: number
  audienceTargeting: boolean
}

function getWatchTimeLine(productId: number): object {
  // Read timeline data
  let data: { [key: number]: WatchTimeLine }
  try {
    data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID) ?? '{}')
  } catch {
    data = {}
  }

  // Get timeline data for product
  const timeline = data[productId]
  if (timeline == null) return {}

  return {
    play_times: [timeline.playTime]
  }
}

function postWatchTimeLine(timeline: WatchTimeLine): void {
  const productId = parseInt(timeline.productId)
  if (isNaN(productId)) return

  // Read timeline data
  let data: { [key: number]: WatchTimeLine }
  try {
    data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID) ?? '{}')
  } catch {
    data = {}
  }

  // Update timeline data
  data[productId] = timeline

  // Write timeline data
  localStorage.setItem(LOCAL_STORAGE_ID, JSON.stringify(data))
}

export function ViuLSImportWatchTimeLine(data: string): void {
  localStorage.setItem(LOCAL_STORAGE_ID, decompress(data))
}

export function ViuLSExportWatchTimeLine(): string {
  return compress(localStorage.getItem(LOCAL_STORAGE_ID) ?? '')
}

export default function ViuLSHandleWatchTimeLine(method: string, url: URL, body: string): object {
  let rsp = {}
  switch (method) {
    case 'GET':
      rsp = getWatchTimeLine(parseInt(url.searchParams.get('productIds') ?? ''))
      break
    case 'POST':
      postWatchTimeLine(JSON.parse(body))
      break
  }
  return rsp
}
