import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'hoyo',
  categories: ['environment'],
  description: 'SDK environment emulation',
  matches: [
    '*://*.hoyolab.com/*',
    '*://*.hoyoverse.com/*',
    '*://*.mihoyo.com/*'
  ]
} satisfies IScriptConfig