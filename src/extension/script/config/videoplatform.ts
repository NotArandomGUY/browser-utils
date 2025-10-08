import { ScriptConfig } from '.'

const YT_LEANBACK_UA = 'Mozilla/5.0 (Fuchsia) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 CrKey/1.56.500000'

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
      '*://*.youtube.com/*',
      '*://*.youtube-nocookie.com/*'
    ],
    networkRules: [
      {
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'user-agent',
              operation: 'set',
              value: YT_LEANBACK_UA
            }
          ]
        },
        condition: {
          urlFilter: '||youtube.com/tv',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      },
      {
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'user-agent',
              operation: 'set',
              value: YT_LEANBACK_UA
            }
          ]
        },
        condition: {
          urlFilter: '||youtube.com/api/stats/*?*el=leanback',
          resourceTypes: ['xmlhttprequest']
        }
      },
      {
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'user-agent',
              operation: 'remove'
            }
          ]
        },
        condition: {
          urlFilter: '||youtube.com/youtubei/',
          resourceTypes: ['xmlhttprequest']
        }
      }
    ]
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