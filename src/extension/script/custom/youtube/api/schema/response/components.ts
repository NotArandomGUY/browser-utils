import { ytv_enp, ytv_ren } from '../define/extended'
import { ytv_arr, ytv_bol, ytv_num, ytv_sch, ytv_str } from '../define/primitive'
import { YTObjectSchema } from '../define/types'

import * as endpoint from '../endpoint'
import * as renderer from '../renderer'

// Components
export const continuationContents = ytv_ren(() => ({
  horizontalListContinuation: renderer.mapped.horizontalListRenderer,
  liveChatContinuation: renderer.mapped.liveChatRenderer,
  sectionListContinuation: renderer.mapped.sectionListRenderer,
  tvSurfaceContentContinuation: renderer.mapped.tvBrowseRenderer
}))
export const responseContext = ytv_ren({
  consistencyTokenJar: ytv_sch({
    encryptedTokenJarContents: ytv_str(),
    expirationSeconds: ytv_str()
  }),
  mainAppWebResponseContext: ytv_sch({
    datasyncId: ytv_str(),
    loggedOut: ytv_bol(),
    trackingParam: ytv_str()
  }),
  maxAgeSeconds: ytv_num(),
  serviceTrackingParams: ytv_arr(ytv_sch({
    params: ytv_arr(ytv_sch({
      key: ytv_str(),
      value: ytv_str()
    })),
    service: ytv_str()
  })),
  visitorData: ytv_str(),
  webResponseContextExtensionData: ytv_sch({
    hasDecorated: ytv_bol(),
    webPrefetchData: ytv_sch({
      navigationEndpoints: ytv_arr(ytv_enp())
    }),
    webResponseContextPreloadData: ytv_sch({
      preloadMessageNames: ytv_arr(ytv_str())
    }),
    ytConfigData: ytv_sch({
      rootVisualElementType: ytv_num(),
      sessionIndex: ytv_num(),
      visitorData: ytv_str()
    })
  })
})

// Schema base
export const SchemaBase = {
  ...renderer.components.SchemaBase,
  actions: ytv_arr(ytv_enp()),
  command: ytv_enp(),
  frameworkUpdates: endpoint.mapped.entityUpdateCommand,
  onResponseReceivedAction: ytv_enp(),
  onResponseReceivedCommand: ytv_enp(),
  onResponseReceivedEndpoint: ytv_enp(),
  onResponseReceivedActions: ytv_arr(ytv_enp()),
  onResponseReceivedCommands: ytv_arr(ytv_enp()),
  onResponseReceivedEndpoints: ytv_arr(ytv_enp()),
  onUiReady: ytv_enp(),
  responseContext
} as const satisfies YTObjectSchema