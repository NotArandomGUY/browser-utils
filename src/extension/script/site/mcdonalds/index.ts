import Logger from '@ext/lib/logger'
import McdBridge from '@ext/site/mcdonalds/bridge'
import McdMessageQueue from '@ext/site/mcdonalds/message-queue'
import McdPluginManager from '@ext/site/mcdonalds/plugin-manager'
import McdLocationPlugin, { type McdLocationData } from '@ext/site/mcdonalds/plugins/location'
import McdSystemPlugin from '@ext/site/mcdonalds/plugins/system'
import McdUserPlugin, { type McdUserData } from '@ext/site/mcdonalds/plugins/user'

const logger = new Logger('McDonald\'s Bridge')

logger.info('injected')

const messageQueue = new McdMessageQueue()
const bridge = new McdBridge(messageQueue)
const pluginManager = new McdPluginManager(messageQueue)

pluginManager.addPlugin(McdSystemPlugin)
pluginManager.addPlugin(McdUserPlugin)
pluginManager.addPlugin(McdLocationPlugin)

window.addEventListener('load', () => {
  self.mcd = {
    bridge,
    setLocation({ latitude, longitude }: Partial<McdLocationData> = {}) {
      if (typeof latitude !== 'number') throw new Error('latitude must be a number')
      if (typeof longitude !== 'number') throw new Error('longitude must be a number')
      bridge.message('location', { setLocation: true, data: { latitude, longitude } }, (error) => {
        if (error) {
          logger.warn('failed to update location:', error)
        } else {
          logger.info('updated location')
        }
      })
    },
    setUser({ mcdonaldsId, firstname, lastname, email }: Partial<McdUserData> = {}) {
      if (typeof mcdonaldsId !== 'string') throw new Error('mcdonaldsId must be a string')
      if (typeof firstname !== 'string') throw new Error('firstname must be a string')
      if (typeof lastname !== 'string') throw new Error('lastname must be a string')
      if (typeof email !== 'string') throw new Error('email must be a string')
      bridge.message('user', { setUser: true, data: { mcdonaldsId, firstname, lastname, email } }, (error) => {
        if (error) {
          logger.warn('failed to update user info:', error)
        } else {
          logger.info('updated user info')
        }
      })
    }
  }

  setInterval(() => {
    bridge.flushMessageQueue()
    pluginManager.flushMessageQueue()
  }, 100)

  setTimeout(() => {
    logger.info('bridge ready')
    document.dispatchEvent(new Event('mcdBridgeReady'))
  }, 500)
})
