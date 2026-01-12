import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const updateNextResponse = (data: YTValueData<YTResponse.Mapped<'next'>>): boolean => {
  delete data.survey

  return true
}

export default class YTMiscsPopupModule extends Feature {
  public constructor() {
    super('popup')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.mealbarPromoRenderer)
    registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}