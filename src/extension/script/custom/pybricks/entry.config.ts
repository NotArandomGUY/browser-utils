import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'pybricks',
  categories: ['keygen'],
  description: 'License generator',
  matches: [
    '*://*.pybricks.com/*'
  ]
} satisfies IScriptConfig