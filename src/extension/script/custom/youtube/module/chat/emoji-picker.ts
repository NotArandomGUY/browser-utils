import { registerYTValueFilter, registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTRenderer, YTValueData } from '@ext/custom/youtube/api/schema'
import { Feature } from '@ext/lib/feature'

const titleCache = new Map<string, YTValueData<YTRenderer.Component<'text'>>>()
const emojiCache = new Map<string, YTValueData<YTRenderer.Component<'emoji'>>[]>()

const filterEmojiPickerUpsellCategoryRenderer = (data: YTValueData<YTRenderer.Mapped<'emojiPickerUpsellCategoryRenderer'>>): boolean => {
  const { categoryId, title } = data

  if (categoryId != null && title != null) {
    titleCache.set(categoryId, title)
  }

  return false
}

const updateEmojiPickerRenderer = (data: YTValueData<YTRenderer.Mapped<'emojiPickerRenderer'>>): void => {
  const { categories } = data

  if (!Array.isArray(categories)) return

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

const updateLiveChatRenderer = (data: YTValueData<YTRenderer.Mapped<'liveChatRenderer'>>): void => {
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
}

export default class YTChatEmojiPickerModule extends Feature {
  public constructor() {
    super('emoji-picker')
  }

  protected activate(): boolean {
    registerYTValueFilter(YTRenderer.mapped.emojiPickerUpsellCategoryRenderer, filterEmojiPickerUpsellCategoryRenderer)
    registerYTValueProcessor(YTRenderer.mapped.liveChatRenderer, updateLiveChatRenderer)
    registerYTValueProcessor(YTRenderer.mapped.emojiPickerRenderer, updateEmojiPickerRenderer, YTValueProcessorType.POST)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}