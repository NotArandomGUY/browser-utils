import initPrivacyBugsnagModule from '@ext/default/privacy/module/bugsnag'
import initPrivacyGoogleAnalyticsModule from '@ext/default/privacy/module/google-analytics'
import initPrivacyHotjarModule from '@ext/default/privacy/module/hotjar'
import initPrivacyNavigatorModule from '@ext/default/privacy/module/navigator'
import initPrivacySentryModule from '@ext/default/privacy/module/sentry'
import Logger from '@ext/lib/logger'

const logger = new Logger('PRIVACY')

logger.info('initializing...')

initPrivacyNavigatorModule()

// Analytics
initPrivacyGoogleAnalyticsModule()
initPrivacyHotjarModule()

// Error monitoring
initPrivacyBugsnagModule()
initPrivacySentryModule()

logger.info('initialized')