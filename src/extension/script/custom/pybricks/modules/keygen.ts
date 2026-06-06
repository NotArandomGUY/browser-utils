import { Feature } from '@ext/lib/feature'

const LICENSE_KEY_DATA = 'PYBRICKS@LICENSE.FREE'
const LICENSE_TTL = 30 * 86400e3 // 30 days

const LicenseStorageKey = 'login.loginState'

export default class PyBricksKeygenModule extends Feature {
  public constructor() {
    super('keygen')
  }

  protected activate(): boolean {
    const state: Record<string, string> = {
      licenceKey: LICENSE_KEY_DATA,
      expiryDate: new Date(Date.now() + LICENSE_TTL).toISOString()
    }
    state.validity = btoa(JSON.stringify(state))

    localStorage.setItem(LicenseStorageKey, JSON.stringify(state))

    return true
  }

  protected deactivate(): boolean {
    localStorage.removeItem(LicenseStorageKey)

    return super.deactivate()
  }
}