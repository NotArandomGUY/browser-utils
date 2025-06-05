import McdPluginManager from '@ext/site/mcdonalds/plugin-manager'
import McdPluginBase from '@ext/site/mcdonalds/plugins/base'

export type McdSystemMessage = {
  // native
  getSelectedLanguage: boolean
} | {
  // native
  getVersion: boolean
}

export default class McdSystemPlugin extends McdPluginBase<McdSystemMessage> {
  public constructor(manager: McdPluginManager) {
    super(manager, 'system')
  }

  protected onMessage(id: string, message: McdSystemMessage): void {
    if ('getSelectedLanguage' in message) {
      this.data(id, { language: 'zh-hk' })
      this.done(id)
      this.debug('Get selected language.')
    }

    if ('getVersion' in message) {
      this.data(id, { platform: 'web' })
      this.done(id)
      this.debug('Get version.')
    }
  }

  protected onCancel(): void {
    return
  }
}
