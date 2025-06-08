import PrivacyBugsnagModule from '@ext/default/privacy/module/bugsnag'
import PrivacyGoogleAnalyticsModule from '@ext/default/privacy/module/google-analytics'
import PrivacyHotjarModule from '@ext/default/privacy/module/hotjar'
import PrivacyNavigatorModule from '@ext/default/privacy/module/navigator'
import PrivacySentryModule from '@ext/default/privacy/module/sentry'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('privacy', group => {
  registerFeature(group, PrivacyNavigatorModule)

  // Analytics
  registerFeature(group, PrivacyGoogleAnalyticsModule)
  registerFeature(group, PrivacyHotjarModule)

  // Error monitoring
  registerFeature(group, PrivacyBugsnagModule)
  registerFeature(group, PrivacySentryModule)
})