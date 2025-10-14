import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'ani.gamer.tw',
  categories: ['videoplatform', 'adblock'],
  description: 'Dedicated ad blocker',
  matches: [
    '*://ani.gamer.com.tw/*'
  ]
} satisfies IScriptConfig