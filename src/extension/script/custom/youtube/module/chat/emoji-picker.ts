import { registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const titleCache = new Map<string, YTValueData<YTRenderer.Component<'text'>>>()
const emojiCache = new Map<string, YTValueData<YTRenderer.Component<'emoji'>>[]>()

const updateEmojiPickerRenderer = (data: YTValueData<YTRenderer.Mapped<'emojiPickerRenderer'>>): boolean => {
  const { categories } = data

  if (Array.isArray(categories)) {
    for (const [categoryId, emojis] of emojiCache) {
      if (categories.some(({ emojiPickerCategoryRenderer }) => emojiPickerCategoryRenderer?.categoryId === categoryId)) continue

      categories.unshift({
        emojiPickerCategoryRenderer: {
          categoryId,
          emojiIds: emojis.map(({ emojiId }) => emojiId).filter(emojiId => emojiId != null),
          title: titleCache.get(categoryId) ?? { simpleText: 'Custom emojis' }
        }
      })
    }
  }

  return true
}

const updateEmojiPickerUpsellCategoryRenderer = (data: YTValueData<YTRenderer.Mapped<'emojiPickerUpsellCategoryRenderer'>>): boolean => {
  const { categoryId, title } = data

  if (categoryId != null && title != null) {
    titleCache.set(categoryId, title)
  }

  return false
}

const updateLiveChatRenderer = (data: YTValueData<YTRenderer.Mapped<'liveChatRenderer'>>): boolean => {
  titleCache.clear()
  emojiCache.clear()

  data.emojis?.forEach(emoji => {
    const categoryId = emoji.emojiId?.split('/')[0]
    if (categoryId == null) return

    let emojis = emojiCache.get(categoryId)
    if (emojis == null) {
      emojis = []
      emojiCache.set(categoryId, emojis)
    }
    emojis.push(emoji)

    delete emoji.isLocked
  })

  return true
}

export default class YTChatEmojiPickerModule extends Feature {
  public constructor() {
    super('emoji-picker')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTRenderer.mapped.emojiPickerUpsellCategoryRenderer, updateEmojiPickerUpsellCategoryRenderer)
    registerYTValueProcessor(YTRenderer.mapped.liveChatRenderer, updateLiveChatRenderer)
    registerYTValueProcessor(YTRenderer.mapped.emojiPickerRenderer, updateEmojiPickerRenderer, YTValueProcessorType.POST)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}