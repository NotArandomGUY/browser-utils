/**
 * Filter rules from: https://easylist.to/easylist/easylist.txt
 */

export const ADBLOCK_STATIC_FILTER_URL_BLOCK_LIST = [
  // Domains filter
  '||a.ads.',
  '||ad1.',
  '||ads2.',
  '||adsbb.',
  '||adserving.',
  '||adsrv.',
  '||aff-ads.',
  '||oascentral.',

  // Scripts filter
  '/adblock/frontend_loader.js',
  '/jquery.adi.js',
  '/jquery.lazyload-ad.js',
  '/jquery.openxtag.js',
  '/jquery.overlayad.js',
  '/jquery.popunder.js',
  '/js/flyad.js',
  '/js/frontend_loader.js',
  '/js/pushjs/1.0.0/subscriber.js',
  '/jsAds-1.4.min.js',
  '/nxst-advertising/dist/htlbid-advertising.min.js',
  '/pgout.js',
  '/pogoadkit.js',
  '/revopush_v2.js',
  '/scripts/FlyAd.js',
  '/scripts/tr2.min.js',
  '/xpopup/xpopup.js',
  '/anymanagerrecover.js'
] satisfies string[]