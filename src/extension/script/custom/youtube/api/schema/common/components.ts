import { ytv_arr, ytv_bol, ytv_num, ytv_sto, ytv_str } from '../define/primitive'

// Components
export const accessibilityData = ytv_sto({
  label: ytv_str()
})
export const accessibility = ytv_sto({
  accessibilityData
})
export const environment = ytv_sto({
  formFactor: ytv_str(['SMALL_FORM_FACTOR']),
  platformName: ytv_str(['PLATFORM_NAME_IOS'])
})
export const highResTime = ytv_sto({
  nanos: ytv_num(),
  seconds: ytv_str()
})
export const url = ytv_sto({
  attributionSrcMode: ytv_str(['ATTRIBUTION_SRC_MODE_LABEL_CHROME']),
  baseUrl: ytv_str(),
  elapsedMediaTimeSeconds: ytv_num(),
  headers: ytv_arr(ytv_sto({
    headerType: ytv_str(['VISITOR_ID', 'EOM_VISITOR_ID', 'USER_AUTH', 'PLUS_PAGE_ID', 'AUTH_USER', 'DATASYNC_ID'])
  })),
  offsetMilliseconds: ytv_num(),
  scrubReferrer: ytv_bol(),
  testUrl: ytv_str()
})