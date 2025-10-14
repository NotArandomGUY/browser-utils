import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'bluemedia',
  categories: ['download'],
  description: 'Auto downloader',
  matches: [
    '*://bluemediadownload.lat/url-generator*',
    '*://bluemediafile.sbs/url-generator*',
    '*://bluemediafiles.com/url-generator*'
  ]
} satisfies IScriptConfig