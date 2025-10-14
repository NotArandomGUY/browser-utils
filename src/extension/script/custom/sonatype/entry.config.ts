import type { IScriptConfig } from '@ext/proto/script/config'

export default {
  name: 'sonatype',
  categories: ['download'],
  description: 'Maven Central download helper',
  matches: [
    '*://central.sonatype.com/*'
  ]
} satisfies IScriptConfig