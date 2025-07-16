import { SITE_DOWNLOAD_SCRIPT_CONFIG } from './download'
import { SITE_ENVIRONMENT_SCRIPT_CONFIG } from './environment'
import { SITE_VIDEOPLATFORM_SCRIPT_CONFIG } from './videoplatform'

export interface ScriptConfig {
  script: string
  categories: string[]
  description: string
  matches?: string[]
  preventDefault?: boolean
  networkRules?: Omit<chrome.declarativeNetRequest.Rule, 'id'>[]
}

export const DEFAULT_SCRIPT_CONFIG: ScriptConfig[] = [
  {
    script: 'adblock',
    categories: ['adblock'],
    description: 'Generic ad blocker'
  },
  {
    script: 'privacy',
    categories: ['privacy'],
    description: 'Generic tracking blocker'
  }
] satisfies ScriptConfig[]

export const SITE_SCRIPT_CONFIG = [
  ...SITE_DOWNLOAD_SCRIPT_CONFIG,
  ...SITE_ENVIRONMENT_SCRIPT_CONFIG,
  ...SITE_VIDEOPLATFORM_SCRIPT_CONFIG
] satisfies ScriptConfig[]