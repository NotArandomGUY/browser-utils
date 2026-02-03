import { registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/command'
import { Feature } from '@ext/lib/feature'

const CONFIG_MENU_TITLE = 'BU Menu'
const TOGGLE_ICONS = [
  YTRenderer.enums.IconType.UNKNOWN,
  YTRenderer.enums.IconType.CHECK
] as const

export const enum YTConfigMenuItemType {
  BUTTON,
  TOGGLE
}

interface YTConfigMenuItemBase<T extends YTConfigMenuItemType> {
  type: T
  key: string
}

interface YTConfigMenuActionItemBase<T extends YTConfigMenuItemType> extends YTConfigMenuItemBase<T> {
  commands?: YTValueData<{ type: YTValueType.ENDPOINT }>[]
  signals?: YTEndpoint.enums.SignalActionType[]
}

interface YTConfigMenuButtonItem extends YTConfigMenuActionItemBase<YTConfigMenuItemType.BUTTON> {
  icon: YTRenderer.enums.IconType
  text: string
}

interface YTConfigMenuToggleItem extends YTConfigMenuActionItemBase<YTConfigMenuItemType.TOGGLE> {
  icon: YTRenderer.enums.IconType
  text: string
  description?: string
  mask?: number
  default?: boolean
  invert?: boolean
}

export type YTConfigMenuItem<T extends YTConfigMenuItemType | void = void> = T extends YTConfigMenuItemType ? Extract<YTConfigMenuItem, { type: T }> : (
  YTConfigMenuButtonItem |
  YTConfigMenuToggleItem
)

export interface YTConfigMenuItemGroup {
  key: string
  items: YTConfigMenuItem[]
}

const configCacheMap = new Map<string, unknown>()
const configItemGroups: YTConfigMenuItemGroup[] = [
  {
    key: 'general',
    items: [
      {
        type: YTConfigMenuItemType.BUTTON,
        key: 'soft-reload',
        icon: YTRenderer.enums.IconType.REFRESH,
        text: 'Soft reload',
        signals: [YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
      }
    ]
  }
]

const getSetterSignalActionType = (key: string, value: unknown): YTEndpoint.enums.SignalActionType => {
  return [YTEndpoint.enums.SignalActionType.CONFIG_VALUE_SET, key, String(value)].join(':') as YTEndpoint.enums.SignalActionType
}

const buildActionItemCommand = (item: Pick<YTConfigMenuActionItemBase<YTConfigMenuItemType>, 'commands' | 'signals'>): YTValueData<{ type: YTValueType.ENDPOINT }> => {
  const commands: YTValueData<{ type: YTValueType.ENDPOINT }>[] = [
    ...item.signals?.map(signal => ({ signalAction: { signal } })) ?? [],
    ...item.commands ?? []
  ]

  return {
    signalServiceEndpoint: {
      signal: 'CLIENT_SIGNAL',
      actions: commands
    }
  }
}

const buildMultiPageMenu = (
  title: string,
  back: boolean,
  sections: YTValueData<{ type: YTValueType.RENDERER }>[]
): YTValueData<{ type: YTValueType.RENDERER }> => {
  return {
    multiPageMenuRenderer: {
      header: {
        simpleMenuHeaderRenderer: {
          backButton: back ? {
            buttonRenderer: {
              accessibility: { label: 'Back' },
              accessibilityData: { accessibilityData: { label: 'Back' } },
              icon: { iconType: YTRenderer.enums.IconType.BACK },
              size: 'SIZE_DEFAULT'
            }
          } : undefined,
          title: { simpleText: title }
        }
      },
      sections,
      style: 'MULTI_PAGE_MENU_STYLE_TYPE_SYSTEM'
    }
  }
}

const buildMultiPageMenuItem = (
  title: string,
  icon: YTRenderer.enums.IconType | null,
  sections: YTValueData<{ type: YTValueType.RENDERER }>[]
): YTValueData<{ type: YTValueType.RENDERER }> => {
  return {
    compactLinkRenderer: {
      icon: icon ? { iconType: icon } : undefined,
      title: { simpleText: title },
      secondaryIcon: { iconType: YTRenderer.enums.IconType.CHEVRON_RIGHT },
      serviceEndpoint: {
        signalServiceEndpoint: {
          signal: 'CLIENT_SIGNAL',
          actions: [{ getMultiPageMenuAction: { menu: buildMultiPageMenu(title, true, sections) } }]
        }
      }
    }
  }
}

const buildOverlayPanel = (
  title: string,
  items: YTValueData<{ type: YTValueType.RENDERER }>[]
): YTValueData<{ type: YTValueType.RENDERER }> => {
  return {
    overlaySectionRenderer: {
      dismissalCommand: {
        signalAction: { signal: YTEndpoint.enums.SignalActionType.POPUP_BACK }
      },
      overlay: {
        overlayTwoPanelRenderer: {
          actionPanel: {
            overlayPanelRenderer: {
              header: { overlayPanelHeaderRenderer: { title: { simpleText: title } } },
              content: { overlayPanelItemListRenderer: { items } }
            }
          }
        }
      }
    }
  }
}

const buildOverlayPanelItem = (
  title: string,
  items: YTValueData<{ type: YTValueType.RENDERER }>[]
): YTValueData<{ type: YTValueType.RENDERER }> => {
  return {
    buttonRenderer: {
      icon: { iconType: YTRenderer.enums.IconType.CHEVRON_RIGHT },
      text: { simpleText: title },
      serviceEndpoint: {
        signalServiceEndpoint: {
          signal: 'CLIENT_SIGNAL',
          actions: [{ openPopupAction: { popup: buildOverlayPanel(title, items) } }]
        }
      }
    }
  }
}

const renderConfigMenuItem = (isTV: boolean, item: YTConfigMenuItem): YTValueData<{ type: YTValueType.RENDERER }> => {
  switch (item.type) {
    case YTConfigMenuItemType.BUTTON:
      return {
        [isTV ? 'buttonRenderer' : 'compactLinkRenderer']: {
          icon: { iconType: item.icon },
          text: { simpleText: item.text },
          title: { simpleText: item.text },
          serviceEndpoint: buildActionItemCommand(item)
        }
      }
    case YTConfigMenuItemType.TOGGLE: {
      const mask = item.mask ?? 1
      const invert = Number(!!item.invert)
      const state = Number(getYTConfigBool(item.key, !!item.default, mask)) ^ invert
      const title = `${item.text}: ${state ? 'ON' : 'OFF'}`
      const commands = item.commands
      const signals = [
        [getSetterSignalActionType(item.key, -mask), ...item.signals ?? []],
        [getSetterSignalActionType(item.key, mask), ...item.signals ?? []]
      ]

      if (isTV) {
        return buildOverlayPanelItem(title, [
          renderConfigMenuItem(isTV, {
            type: YTConfigMenuItemType.BUTTON,
            key: `${item.key}:1`,
            icon: TOGGLE_ICONS[state],
            text: 'ON',
            commands,
            signals: signals[1 ^ invert]
          }),
          renderConfigMenuItem(isTV, {
            type: YTConfigMenuItemType.BUTTON,
            key: `${item.key}:0`,
            icon: TOGGLE_ICONS[state ^ 1],
            text: 'OFF',
            commands,
            signals: signals[0 ^ invert]
          })
        ])
      } else {
        return buildMultiPageMenuItem(title, item.icon, [
          {
            toggleItemRenderer: {
              label: { simpleText: item.text },
              descriptionLines: item.description ? [{ simpleText: item.description }] : undefined,
              toggleOnActions: [buildActionItemCommand({ commands, signals: signals[1 ^ invert] })],
              toggleOffActions: [buildActionItemCommand({ commands, signals: signals[0 ^ invert] })],
              toggled: !!state
            }
          }
        ])
      }
    }
    default:
      throw new Error('invalid menu item type')
  }
}

const renderConfigMenuItemGroup = (isTV: boolean, group: YTConfigMenuItemGroup): YTValueData<{ type: YTValueType.RENDERER }>[] | YTValueData<{ type: YTValueType.RENDERER }> => {
  const items = group.items.map(renderConfigMenuItem.bind(null, isTV))
  const title = group.key.replace(/(^|-)[a-z]/g, c => c.toUpperCase().replace('-', ' '))

  return isTV ? buildOverlayPanelItem(title, items) : buildMultiPageMenuItem(title, null, [{ multiPageMenuSectionRenderer: { items } }])
}

const renderConfigMenuButton = (isTV: boolean): YTValueData<{ type: YTValueType.RENDERER }> => {
  const items = configItemGroups.flatMap(renderConfigMenuItemGroup.bind(null, isTV))

  return {
    buttonRenderer: {
      style: 'STYLE_DEFAULT',
      size: YTRenderer.enums.SizeType.SIZE_DEFAULT,
      icon: { iconType: isTV ? YTRenderer.enums.IconType.YOUTUBE_TV : YTRenderer.enums.IconType.TROPHY_STAR },
      text: isTV ? { simpleText: CONFIG_MENU_TITLE } : undefined,
      accessibility: { label: CONFIG_MENU_TITLE },
      accessibilityData: { accessibilityData: { label: CONFIG_MENU_TITLE } },
      tooltip: CONFIG_MENU_TITLE,
      isDisabled: false,
      command: {
        openPopupAction: {
          popup: isTV ? buildOverlayPanel(CONFIG_MENU_TITLE, items) : buildMultiPageMenu(CONFIG_MENU_TITLE, false, [{ multiPageMenuSectionRenderer: { items } }]),
          popupType: 'RESPONSIVE_DROPDOWN'
        }
      }
    }
  }
}

const updateDesktopTopbarRenderer = (data: YTValueData<YTRenderer.Mapped<'desktopTopbarRenderer'>>): void => {
  data.topbarButtons ??= []
  data.topbarButtons.unshift(renderConfigMenuButton(false))
}

const updateTvSurfaceContentRenderer = (data: YTValueData<YTRenderer.Mapped<'tvSurfaceContentRenderer'>>): void => {
  data.content?.sectionListRenderer?.contents?.unshift(
    { itemSectionRenderer: { contents: [renderConfigMenuButton(true)] } },
    { itemSectionRenderer: { contents: [] } }
  )
}

export const getYTConfigBool = (key: string, defaultValue: boolean, mask = 1): boolean => {
  return (getYTConfigInt(key, defaultValue ? mask : 0) & mask) !== 0
}

export const getYTConfigInt = (key: string, defaultValue: number): number => {
  let value = Number(configCacheMap.has(key) ? configCacheMap.get(key) : localStorage.getItem(`bu-${key}`) ?? defaultValue)
  if (isNaN(value)) value = defaultValue
  configCacheMap.set(key, value)

  return value
}

export const setYTConfigBool = (key: string, value: boolean, mask = 1): void => {
  setYTConfigInt(key, (getYTConfigInt(key, 0) & ~mask) | (value ? mask : 0))
}

export const setYTConfigInt = (key: string, value: number): void => {
  if (isNaN(value)) return

  localStorage.setItem(`bu-${key}`, String(value))
  configCacheMap.set(key, value)
}

export const registerYTConfigMenuItemGroup = (key: string, items: YTConfigMenuItem[]): void => {
  let group = configItemGroups.find(g => g.key === key)
  if (group == null) {
    group = { key, items: [] }
    configItemGroups.push(group)
  }

  for (const item of items) {
    if (group.items.some(i => i.key === item.key && (i as YTConfigMenuToggleItem).mask === (item as YTConfigMenuToggleItem).mask)) return

    if (item.type === YTConfigMenuItemType.TOGGLE) {
      const mask = item.mask ?? 1

      registerYTSignalActionHandler(getSetterSignalActionType(item.key, -mask), setYTConfigBool.bind(null, item.key, false, mask))
      registerYTSignalActionHandler(getSetterSignalActionType(item.key, mask), setYTConfigBool.bind(null, item.key, true, mask))
      item.signals ??= [YTEndpoint.enums.SignalActionType.CLOSE_POPUP, YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE]
    }
  }

  group.items.push(...items)
}

export default class YTCoreConfigModule extends Feature {
  public constructor() {
    super('config')
  }

  protected activate(): boolean {
    registerYTValueProcessor(YTRenderer.mapped.tvSurfaceContentRenderer, updateTvSurfaceContentRenderer, YTValueProcessorType.POST)
    registerYTValueProcessor(YTRenderer.mapped.desktopTopbarRenderer, updateDesktopTopbarRenderer, YTValueProcessorType.POST)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}