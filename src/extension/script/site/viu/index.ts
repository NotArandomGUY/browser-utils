import Logger from '@ext/lib/logger'
import { ViuLSExportHistory, ViuLSImportHistory } from '@ext/site/viu/local-server/history'
import { ViuLSExportWatchTimeLine, ViuLSImportWatchTimeLine } from '@ext/site/viu/local-server/timeline'
import ViuLSApplyUpdate from '@ext/site/viu/local-server/update'
import initViuAdblockModule from '@ext/site/viu/module/adblock'
import initViuNetworkModule from '@ext/site/viu/module/network'
import initViuPlayerModule from '@ext/site/viu/module/player'
import initViuRemoteModule from '@ext/site/viu/module/remote'
import initViuRenderModule from '@ext/site/viu/module/render'
import initViuWebpackModule from '@ext/site/viu/module/webpack'
import { compressToBase64, decompressFromBase64 } from 'lz-string'

const logger = new Logger('VIU')

logger.info('initializing...')

ViuLSApplyUpdate()

function importUserData(data: string): void {
  const [history, timeline] = JSON.parse(decompressFromBase64(data))

  ViuLSImportHistory(history)
  ViuLSImportWatchTimeLine(timeline)
}

function exportUserData(): string {
  return compressToBase64(JSON.stringify([
    ViuLSExportHistory(),
    ViuLSExportWatchTimeLine()
  ]))
}

window.importUserData = importUserData
window.exportUserData = exportUserData

initViuAdblockModule()
initViuNetworkModule()
initViuPlayerModule()
initViuRemoteModule()
initViuRenderModule()
initViuWebpackModule()

logger.info('initialized')