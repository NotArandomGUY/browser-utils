import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'netflix',
  categories: ['videoplatform'],
  description: 'Debugging tools',
  matches: [
    '*://*.netflix.com/*'
  ]
} satisfies IScriptConfig