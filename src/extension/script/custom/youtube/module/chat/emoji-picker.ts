import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/custom/youtube/api/renderer'
import { Feature } from '@ext/lib/feature'

const updateEmojiPickerRenderer = (data: YTRendererData<YTRenderer<'emojiPickerRenderer'>>): boolean => {
  // Replace upsell categories with noraml categories
  data.categories?.forEach(c => {
    if (c.emojiPickerUpsellCategoryRenderer == null) return

    const { categoryId, emojiIds, title } = c.emojiPickerUpsellCategoryRenderer

    c.emojiPickerCategoryRenderer = {
      categoryId,
      emojiIds,
      title
    }
    delete c.emojiPickerUpsellCategoryRenderer
  })

  return true
}

export default class YTChatEmojiPickerModule extends Feature {
  public constructor() {
    super('emoji-picker')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['emojiPickerRenderer'], updateEmojiPickerRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}