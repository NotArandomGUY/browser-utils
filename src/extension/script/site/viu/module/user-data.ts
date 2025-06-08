import { Feature } from '@ext/lib/feature'
import { ViuLSExportHistory, ViuLSImportHistory } from '@ext/site/viu/local-server/history'
import { ViuLSExportWatchTimeLine, ViuLSImportWatchTimeLine } from '@ext/site/viu/local-server/timeline'
import ViuLSApplyUpdate from '@ext/site/viu/local-server/update'
import { compressToBase64, decompressFromBase64 } from 'lz-string'

export default class ViuUserDataModule extends Feature {
  protected activate(): boolean {
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

    ViuLSApplyUpdate()

    return true
  }

  protected deactivate(): boolean {
    delete window.importUserData
    delete window.exportUserData

    return true
  }
}