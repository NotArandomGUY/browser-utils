import { ScriptConfig } from '.'

export const SITE_ENVIRONMENT_SCRIPT_CONFIG = [
  {
    script: 'hoyo',
    categories: ['environment'],
    description: 'SDK environment emulation',
    matches: [
      '*://*.hoyolab.com/*',
      '*://*.hoyoverse.com/*',
      '*://*.mihoyo.com/*'
    ]
  },
  {
    script: 'mcdonalds',
    categories: ['environment'],
    description: 'Mobile app environment emulation',
    matches: [
      '*://*.mcdonalds.com/*',
      '*://*.mcdonalds.com.hk/*',
      '*://*.studiom-publicis.com/*'
    ]
  }
] satisfies ScriptConfig[]