import { registerYTValueFilter, registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTResponse, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const updateNextResponse = (data: YTValueData<YTResponse.Mapped<'next'>>): void => {
  delete data.survey
}

export default class YTMiscsPopupModule extends Feature {
  public constructor() {
    super('popup')
  }

  protected activate(cleanupCallbacks: Function[]): boolean {
    cleanupCallbacks.push(
      registerYTValueFilter(YTRenderer.mapped.mealbarPromoRenderer),
      registerYTValueProcessor(YTResponse.mapped.next, updateNextResponse)
    )

    return true
  }
}