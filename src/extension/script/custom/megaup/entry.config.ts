import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'megaup',
  categories: ['download'],
  description: 'Auto downloader',
  matches: [
    '*://*.megaup.net/*'
  ]
} satisfies IScriptConfig