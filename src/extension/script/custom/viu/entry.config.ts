import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'viu',
  categories: ['videoplatform', 'adblock', 'mod'],
  description: 'Dedicated ad blocker & Mods',
  matches: [
    '*://*.viu.com/*',
    '*://*.viu.tv/*'
  ]
} satisfies IScriptConfig