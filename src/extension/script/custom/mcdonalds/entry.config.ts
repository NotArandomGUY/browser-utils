import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'mcdonalds',
  categories: ['environment'],
  description: 'Mobile app environment emulation',
  matches: [
    '*://*.mcdonalds.com/*',
    '*://*.mcdonalds.com.hk/*',
    '*://*.studiom-publicis.com/*'
  ]
} satisfies IScriptConfig