import Logger from '@ext/lib/logger'
import { dispatchYTOpenPopupAction } from '@ext/site/youtube/module/action'

const logger = new Logger('YT-LOGGING')

const enum YTLoggingBiscottiBasedDetectionResult {
  BISCOTTI_BASED_DETECTION_RESULT_DETECTED = 0,
  BISCOTTI_BASED_DETECTION_RESULT_NOT_DETECTED = 1,
  BISCOTTI_BASED_DETECTION_RESULT_UNSPECIFIED = 2,
  BISCOTTI_BASED_DETECTION_RESULT_KNOWN_FAILURE = 3,
  BISCOTTI_BASED_DETECTION_RESULT_UNKNOWN_FAILURE = 4
}

interface YTLoggingSliEvent {
  dimensions: {
    csn: string
    mainAppWeb: {
      isShellLoad: boolean
    }
    survivalSli: {
      partitionMinute: number
      survivalStatus: string
    }
  }
  records: {
    name: string
    state: string
    status: string
  }[]
}

interface YTLoggingImsInfo {
  auth?: string
  cttAuthInfo?: string
  isJspb?: boolean
  tier?: number
}

interface YTLoggingImsPayloadVariants {
  applicationStarted: {
    staticContext: {
      cpuCores: number
      memoryTotalKbytes: string
    }
  }
  biscottiBasedDetection: {
    contentCpn: string
    detected: boolean
    detectionResult: keyof typeof YTLoggingBiscottiBasedDetectionResult
    source: string
  }
  foregroundHeartbeat: {
    clientDocumentNonce: string
    firstActivityMs: string
    index: string
    lastEventDeltaMs: string
    trigger: string
  }
  genericClientExperimentEvent: {
    eventType: string
  }
  latencyActionTicked: {
    clientActionNonce: string
    tickName: string
  }
  sliEventBatch: {
    loggedEvents: YTLoggingSliEvent[]
    unloggedEvents: YTLoggingSliEvent[]
  }
  streamzIncremented: {
    serializedIncrementBatch: string
  }
  visualElementGestured: {
    csn: string
    gestureType: string
    ve: {
      trackingParams: string
    }
  }
}
type YTLoggingImsPayloadVariant = { [K in keyof YTLoggingImsPayloadVariants]: { [V in K]: YTLoggingImsPayloadVariants[K] } }[keyof YTLoggingImsPayloadVariants]

type YTLoggingImsPayload = {
  context: {
    lastActivityMs: string
  }
  eventTimeMs: number
} & YTLoggingImsPayloadVariant

const triggeredDetectionSources = new Set<string>()

function handleBiscottiBasedDetection(payload: YTLoggingImsPayloadVariants['biscottiBasedDetection']): void {
  const { detected, detectionResult, source } = payload

  logger.debug('biscotti based detection source:', source, 'result:', detectionResult)
  if (!detected) return

  logger.warn('triggered biscotti based detection source:', source)

  triggeredDetectionSources.add(source)
  if (triggeredDetectionSources.size > 1) return

  setTimeout(() => {
    dispatchYTOpenPopupAction({
      durationHintMs: 10e3,
      popup: {
        notificationActionRenderer: {
          responseText: { runs: [{ text: `You have triggered adblocker detection [${Array.from(triggeredDetectionSources.values()).join(',')}]` }] }
        }
      },
      popupType: 'TOAST'
    })
    triggeredDetectionSources.clear()
  }, 5e3)
}

export default function initYTLoggingModule(): void {
  window.yt = window.yt ?? {}
  window.yt.logging = window.yt.logging ?? {}

  let ims: object | undefined = undefined
  Object.defineProperty(window.yt.logging, 'ims', {
    get() {
      return ims
    },
    set(v) {
      Object.defineProperty(v, 'storePayload', {
        value(info: YTLoggingImsInfo, payload: YTLoggingImsPayload) {
          const path = [info.auth ?? 'undefined', info.isJspb ?? 'undefined', info.cttAuthInfo ?? 'undefined', info.tier ?? 'undefined'].join('/')
          logger.trace(`ims payload(${path}):`, payload)

          if ('biscottiBasedDetection' in payload) handleBiscottiBasedDetection(payload.biscottiBasedDetection)
        }
      })
      ims = v
    }
  })
}