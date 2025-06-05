import { ScriptConfig } from '.'

export const SITE_DOWNLOAD_SCRIPT_CONFIG = [
  {
    script: 'bluemedia',
    categories: ['download'],
    description: 'Auto downloader',
    matches: [
      '*://bluemediadownload.lat/url-generator*',
      '*://bluemediafile.sbs/url-generator*',
      '*://bluemediafiles.com/url-generator*'
    ]
  },
  {
    script: 'megaup',
    categories: ['download'],
    description: 'Auto downloader',
    matches: [
      '*://megaup.net/*'
    ]
  },
  {
    script: 'sonatype',
    categories: ['download'],
    description: 'Maven Central download helper',
    matches: [
      '*://central.sonatype.com/*'
    ]
  }
] satisfies ScriptConfig[]