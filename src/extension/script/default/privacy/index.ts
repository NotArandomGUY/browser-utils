import initPrivacyGoogleAnalyticsModule from '@ext/default/privacy/module/google-analytics'
import initPrivacyNavigatorModule from '@ext/default/privacy/module/navigator'
import initPrivacySentryModule from '@ext/default/privacy/module/sentry'
import Logger from '@ext/lib/logger'

const logger = new Logger('PRIVACY')

logger.info('initializing...')

initPrivacyNavigatorModule()
initPrivacyGoogleAnalyticsModule()
initPrivacySentryModule()

logger.info('initialized')