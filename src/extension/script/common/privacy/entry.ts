import PrivacyBugsnagModule from '@ext/common/privacy/module/bugsnag'
import PrivacyGoogleAnalyticsModule from '@ext/common/privacy/module/google-analytics'
import PrivacyHotjarModule from '@ext/common/privacy/module/hotjar'
import PrivacyNavigatorModule from '@ext/common/privacy/module/navigator'
import PrivacyNetworkModule from '@ext/common/privacy/module/network'
import PrivacySentryModule from '@ext/common/privacy/module/sentry'
import { registerFeature, registerFeatureGroup } from '@ext/lib/feature'

registerFeatureGroup('privacy', group => {
  registerFeature(group, PrivacyNetworkModule)
  registerFeature(group, PrivacyNavigatorModule)

  // Analytics
  registerFeature(group, PrivacyGoogleAnalyticsModule)
  registerFeature(group, PrivacyHotjarModule)

  // Error monitoring
  registerFeature(group, PrivacyBugsnagModule)
  registerFeature(group, PrivacySentryModule)
}, ['preload'])