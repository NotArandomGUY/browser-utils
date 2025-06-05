import McdPluginManager from '@ext/site/mcdonalds/plugin-manager'
import McdPluginBase from '@ext/site/mcdonalds/plugins/base'

export interface McdLocationData {
  latitude: number
  longitude: number
}

export type McdLocationMessage = {
  // native
  continuous: boolean
} | {
  // custom
  setLocation: boolean
  data: McdLocationData
}

export default class McdLocationPlugin extends McdPluginBase<McdLocationMessage> {
  private locationData: McdLocationData | null

  public constructor(manager: McdPluginManager) {
    super(manager, 'location')

    this.locationData = null
  }

  protected onMessage(id: string, message: McdLocationMessage): void {
    if ('continuous' in message) {
      let locationData = this.locationData
      if (locationData == null) this.debug('Waiting for location...')

      const loop = setInterval(() => {
        locationData = this.locationData
        if (locationData == null) return

        this.data(id, locationData)
        if (!message.continuous) {
          this.done(id)
          clearInterval(loop)
        }

        this.debug('Get location, continuous:', message.continuous)
      }, 1e3)
    }

    if ('setLocation' in message) {
      const { latitude, longitude } = message.data

      this.locationData = {
        latitude: Number(latitude ?? 0),
        longitude: Number(longitude ?? 0)
      }

      this.debug('Set location:', this.locationData)
    }
  }

  protected onCancel(): void {
    return
  }
}
