import initAdblockGoogleAdModule from '@ext/default/adblock/module/google-ad'
import initAdblockNavigatorModule from '@ext/default/adblock/module/navigator'
import Logger from '@ext/lib/logger'

const logger = new Logger('ADBLOCK')

logger.info('initializing...')

initAdblockNavigatorModule()
initAdblockGoogleAdModule()

logger.info('initialized')