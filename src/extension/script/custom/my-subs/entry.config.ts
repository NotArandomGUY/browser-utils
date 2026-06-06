import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'my-subs',
  categories: ['download'],
  description: 'Auto downloader',
  matches: [
    '*://my-subs.co/*'
  ]
} satisfies IScriptConfig