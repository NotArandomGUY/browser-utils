import { registerYTValueProcessor } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const updateEmojiPickerRenderer = (data: YTValueData<YTRenderer.Mapped<'emojiPickerRenderer'>>): boolean => {
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
    registerYTValueProcessor(YTRenderer.mapped.emojiPickerRenderer, updateEmojiPickerRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}