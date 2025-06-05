import initTrackingGAModule from '@ext/default/privacy/module/ga'
import initTrackingSentryModule from '@ext/default/privacy/module/sentry'
import Logger from '@ext/lib/logger'

const logger = new Logger('PRIVACY')

logger.info('initializing...')

initTrackingGAModule()
initTrackingSentryModule()

logger.info('initialized')