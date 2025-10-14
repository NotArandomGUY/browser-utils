import McdPluginManager from '@ext/custom/mcdonalds/plugin-manager'
import McdPluginBase from '@ext/custom/mcdonalds/plugins/base'

export interface McdUserData {
  mcdonaldsId: string
  firstname: string
  lastname: string
  email: string
}

export type McdUserMessage = {
  // native
  getuser: boolean
} | {
  // native
  promptlogin: boolean
} | {
  // custom
  setUser: boolean
  data: McdUserData
}

export default class McdUserPlugin extends McdPluginBase<McdUserMessage> {
  private userData: McdUserData | null

  public constructor(manager: McdPluginManager) {
    super(manager, 'user')

    this.userData = null
  }

  protected onMessage(id: string, message: McdUserMessage): void {
    if ('promptlogin' in message || 'getuser' in message) {
      this.getUser().then(userData => {
        this.data(id, userData)
        this.done(id)
        this.debug('Get user.')
      }).catch(error => {
        this.error(id, error)
      })
    }

    if ('setUser' in message) {
      this.userData = message.data
      this.done(id)

      this.debug('Set user:', this.userData)
    }
  }

  protected onCancel(): void {
    return
  }

  private async getUser(): Promise<McdUserData> {
    let userData = this.userData
    if (userData) return userData

    return new Promise(resolve => {
      this.debug('Waiting for user...')

      const loop = setInterval(() => {
        userData = this.userData
        if (!userData) return

        clearInterval(loop)
        resolve(userData)
      }, 500)
    })
  }
}
