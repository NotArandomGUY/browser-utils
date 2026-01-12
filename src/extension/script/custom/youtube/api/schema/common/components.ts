import { ytv_num, ytv_sch, ytv_str } from '../define/primitive'

// Components
export const accessibilityData = ytv_sch({
  label: ytv_str()
})
export const accessibility = ytv_sch({
  accessibilityData
})
export const environment = ytv_sch({
  formFactor: ytv_str(['SMALL_FORM_FACTOR']),
  platformName: ytv_str(['PLATFORM_NAME_IOS'])
})
export const url = ytv_sch({
  attributionSrcMode: ytv_str(['ATTRIBUTION_SRC_MODE_LABEL_CHROME']),
  baseUrl: ytv_str(),
  elapsedMediaTimeSeconds: ytv_num(),
  offsetMilliseconds: ytv_num(),
  testUrl: ytv_str()
})