import { registerYTValueProcessor, YTValueProcessorType } from '@ext/custom/youtube/api/processor'
import { YTEndpoint, YTRenderer, YTValueData, YTValueType } from '@ext/custom/youtube/api/schema'
import { registerYTSignalActionHandler } from '@ext/custom/youtube/module/core/event'
import { Feature } from '@ext/lib/feature'

const CONFIG_MENU_TITLE = 'BU Menu'

export const CONFIG_TEXT_DISABLE = 'Disable'
export const CONFIG_TEXT_ENABLE = 'Enable'

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
  disabledIcon: YTRenderer.enums.IconType
  disabledText: string
  enabledIcon: YTRenderer.enums.IconType
  enabledText: string
  defaultValue?: boolean
  mask?: number
}

export type YTConfigMenuItem<T extends YTConfigMenuItemType | void = void> = T extends YTConfigMenuItemType ? Extract<YTConfigMenuItem, { type: T }> : (
  YTConfigMenuButtonItem |
  YTConfigMenuToggleItem
)

const configCacheMap = new Map<string, unknown>()
const configMenuItems: YTConfigMenuItem[] = [
  {
    type: YTConfigMenuItemType.BUTTON,
    key: 'soft-reload',
    icon: YTRenderer.enums.IconType.REFRESH,
    text: 'Soft reload',
    commands: [{ signalAction: { signal: YTEndpoint.enums.SignalActionType.SOFT_RELOAD_PAGE } }]
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
    commandExecutorCommand: {
      commands: commands.map(command => command.signalAction ? {
        signalServiceEndpoint: {
          signal: 'CLIENT_SIGNAL',
          actions: [command]
        }
      } : command)
    }
  }
}

const renderConfigMenuItem = (isTV: boolean, item: YTConfigMenuItem): YTValueData<{ type: YTValueType.RENDERER }> => {
  switch (item.type) {
    case YTConfigMenuItemType.BUTTON:
      return {
        [isTV ? 'buttonRenderer' : 'menuServiceItemRenderer']: {
          icon: { iconType: item.icon },
          text: { simpleText: item.text },
          serviceEndpoint: buildActionItemCommand(item)
        }
      }
    case YTConfigMenuItemType.TOGGLE: {
      const mask = item.mask ?? 1

      return {
        [isTV ? 'toggleButtonRenderer' : 'toggleMenuServiceItemRenderer']: {
          defaultIcon: { iconType: item.disabledIcon },
          defaultText: { simpleText: item.disabledText },
          defaultServiceEndpoint: buildActionItemCommand({
            commands: item.commands,
            signals: [getSetterSignalActionType(item.key, mask), ...item.signals ?? []]
          }),
          toggledIcon: { iconType: item.enabledIcon },
          toggledText: { simpleText: item.enabledText },
          toggledServiceEndpoint: buildActionItemCommand({
            commands: item.commands,
            signals: [getSetterSignalActionType(item.key, -mask), ...item.signals ?? []]
          }),
          isToggled: getYTConfigBool(item.key, !!item.defaultValue, mask)
        }
      }
    }
    default:
      throw new Error('invalid menu item type')
  }
}

const renderConfigPopupButton = (isTV: boolean): YTValueData<{ type: YTValueType.RENDERER }> => {
  const items = configMenuItems.map(renderConfigMenuItem.bind(null, isTV))

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
          popup: isTV ? {
            overlaySectionRenderer: {
              dismissalCommand: {
                signalAction: { signal: YTEndpoint.enums.SignalActionType.POPUP_BACK }
              },
              overlay: {
                overlayTwoPanelRenderer: {
                  actionPanel: {
                    overlayPanelRenderer: {
                      content: { overlayPanelItemListRenderer: { items } },
                      header: { overlayPanelHeaderRenderer: { title: { simpleText: CONFIG_MENU_TITLE } } }
                    }
                  }
                }
              }
            }
          } : {
            menuPopupRenderer: {
              items
            }
          },
          popupType: 'RESPONSIVE_DROPDOWN'
        }
      }
    }
  }
}

const updateDesktopTopbarRenderer = (data: YTValueData<YTRenderer.Mapped<'desktopTopbarRenderer'>>): boolean => {
  data.topbarButtons ??= []
  data.topbarButtons.unshift(renderConfigPopupButton(false))

  return true
}

const updateTvSurfaceContentRenderer = (data: YTValueData<YTRenderer.Mapped<'tvSurfaceContentRenderer'>>): boolean => {
  data.content?.sectionListRenderer?.contents?.unshift({
    itemSectionRenderer: { contents: [renderConfigPopupButton(true)] }
  })

  return true
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

export const registerYTConfigMenuItem = (item: YTConfigMenuItem): void => {
  if (configMenuItems.some(i => i.key === item.key && (i as YTConfigMenuToggleItem).mask === (item as YTConfigMenuToggleItem).mask)) return

  if (item.type === YTConfigMenuItemType.TOGGLE) {
    const mask = item.mask ?? 1

    registerYTSignalActionHandler(getSetterSignalActionType(item.key, -mask), setYTConfigBool.bind(null, item.key, false, mask))
    registerYTSignalActionHandler(getSetterSignalActionType(item.key, mask), setYTConfigBool.bind(null, item.key, true, mask))
  }

  configMenuItems.push(item)
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