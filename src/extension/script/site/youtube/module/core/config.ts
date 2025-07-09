import { Feature } from '@ext/lib/feature'
import { YTSignalActionType } from '@ext/site/youtube/api/endpoint'
import { registerYTRendererPreProcessor, YTRenderer, YTRendererData, YTRendererSchemaMap } from '@ext/site/youtube/api/renderer'
import { YTValueData, YTValueType } from '@ext/site/youtube/api/types/common'
import { YTIconType } from '@ext/site/youtube/api/types/icon'
import { YTSizeType } from '@ext/site/youtube/api/types/size'
import { registerYTSignalActionHandler } from '@ext/site/youtube/module/core/action'

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
  signals?: YTSignalActionType[]
}

interface YTConfigMenuButtonItem extends YTConfigMenuActionItemBase<YTConfigMenuItemType.BUTTON> {
  icon: YTIconType
  text: string
}

interface YTConfigMenuToggleItem extends YTConfigMenuActionItemBase<YTConfigMenuItemType.TOGGLE> {
  disabledIcon: YTIconType
  disabledText: string
  enabledIcon: YTIconType
  enabledText: string
  defaultValue: boolean
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
    icon: YTIconType.REFRESH,
    text: 'Soft reload',
    commands: [{ signalAction: { signal: YTSignalActionType.SOFT_RELOAD_PAGE } }]
  }
]

function getSetterSignalActionType(key: string, value: unknown): YTSignalActionType {
  return [YTSignalActionType.CONFIG_VALUE_SET, key, String(value)].join(':') as YTSignalActionType
}

function buildActionItemCommand(item: Pick<YTConfigMenuActionItemBase<YTConfigMenuItemType>, 'commands' | 'signals'>): YTValueData<{ type: YTValueType.ENDPOINT }> {
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

function renderConfigMenuItem(item: YTConfigMenuItem): YTValueData<{ type: YTValueType.RENDERER }> {
  switch (item.type) {
    case YTConfigMenuItemType.BUTTON:
      return {
        menuServiceItemRenderer: {
          icon: { iconType: item.icon },
          text: { simpleText: item.text },
          serviceEndpoint: buildActionItemCommand(item)
        }
      }
    case YTConfigMenuItemType.TOGGLE:
      return {
        toggleMenuServiceItemRenderer: {
          defaultIcon: { iconType: item.disabledIcon },
          defaultText: { simpleText: item.disabledText },
          defaultServiceEndpoint: buildActionItemCommand({
            commands: item.commands,
            signals: [getSetterSignalActionType(item.key, 1), ...item.signals ?? []]
          }),
          toggledIcon: { iconType: item.enabledIcon },
          toggledText: { simpleText: item.enabledText },
          toggledServiceEndpoint: buildActionItemCommand({
            commands: item.commands,
            signals: [getSetterSignalActionType(item.key, 0), ...item.signals ?? []]
          }),
          isToggled: getYTConfigBool(item.key, item.defaultValue)
        }
      }
    default:
      throw new Error('invalid menu item type')
  }
}

function updateDesktopTopbarRenderer(data: YTRendererData<YTRenderer<'desktopTopbarRenderer'>>): boolean {
  data.topbarButtons ??= []
  data.topbarButtons.unshift({
    buttonRenderer: {
      style: 'STYLE_DEFAULT',
      size: YTSizeType.SIZE_DEFAULT,
      icon: { iconType: YTIconType.TROPHY_STAR },
      accessibility: { label: 'BU Menu' },
      accessibilityData: { accessibilityData: { label: 'BU Menu' } },
      tooltip: 'BU Menu',
      isDisabled: false,
      command: {
        openPopupAction: {
          popup: {
            menuPopupRenderer: {
              items: configMenuItems.map(renderConfigMenuItem)
            }
          },
          popupType: 'RESPONSIVE_DROPDOWN'
        }
      }
    }
  })

  return true
}

export function getYTConfigBool(key: string, defaultValue: boolean): boolean {
  return getYTConfigInt(key, defaultValue ? 1 : 0) !== 0
}

export function getYTConfigInt(key: string, defaultValue: number): number {
  let value = Number(configCacheMap.has(key) ? configCacheMap.get(key) : localStorage.getItem(`bu-${key}`) ?? defaultValue)
  if (isNaN(value)) value = defaultValue

  configCacheMap.set(key, value)

  return value
}

export function setYTConfigBool(key: string, value: boolean): void {
  setYTConfigInt(key, value ? 1 : 0)
}

export function setYTConfigInt(key: string, value: number): void {
  if (isNaN(value)) return

  localStorage.setItem(`bu-${key}`, String(value))
  configCacheMap.set(key, value)
}

export function registerYTConfigMenuItem(item: YTConfigMenuItem): void {
  if (configMenuItems.find(i => i.key === item.key) != null) return

  if (item.type === YTConfigMenuItemType.TOGGLE) {
    registerYTSignalActionHandler(getSetterSignalActionType(item.key, 0), setYTConfigBool.bind(null, item.key, false))
    registerYTSignalActionHandler(getSetterSignalActionType(item.key, 1), setYTConfigBool.bind(null, item.key, true))
  }

  configMenuItems.push(item)
}

export default class YTCoreConfigModule extends Feature {
  public constructor() {
    super('core-config')
  }

  protected activate(): boolean {
    registerYTRendererPreProcessor(YTRendererSchemaMap['desktopTopbarRenderer'], updateDesktopTopbarRenderer)

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}