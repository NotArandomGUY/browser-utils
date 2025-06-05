import { ScriptConfig } from '.'

export const SITE_VIDEOPLATFORM_SCRIPT_CONFIG = [
  {
    script: 'ani.gamer',
    categories: ['videoplatform', 'adblock'],
    description: 'Dedicated ad blocker',
    matches: [
      '*://ani.gamer.com.tw/*'
    ]
  },
  {
    script: 'youtube',
    categories: ['videoplatform', 'adblock', 'mod'],
    description: 'Dedicated ad blocker & Mods',
    matches: [
      '*://*.youtube.com/*'
    ],
    preventDefault: true
  },
  {
    script: 'viu',
    categories: ['videoplatform', 'adblock', 'mod'],
    description: 'Dedicated ad blocker & Mods',
    matches: [
      '*://*.viu.com/*',
      '*://*.viu.tv/*'
    ]
  }
] satisfies ScriptConfig[]