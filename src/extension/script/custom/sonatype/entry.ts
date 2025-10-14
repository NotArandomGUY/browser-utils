import Logger from '@ext/lib/logger'

const logger = new Logger('MVNDownload')

logger.info('injected')

interface ArtifactInfo {
  groupId: string
  artifactId: string
  version: string
}

const BASE_URL = 'https://repo1.maven.org/maven2'
const SELECTOR_VERSION = '.nx-dropdown__toggle-label'
const SELECTOR_SUMMARY = '[class*=SummaryView_purlWrapper__]'

function getSelectedVersion(): string {
  return document.querySelector<HTMLSpanElement>(SELECTOR_VERSION)?.innerText ?? '0.0.0'
}

function getArtifactInfo(): ArtifactInfo | null {
  const [type, groupId, artifactId] = location.pathname.split('/').slice(1)
  if (type !== 'artifact') return null

  return {
    groupId,
    artifactId,
    version: getSelectedVersion()
  }
}

function downloadArtifact(): void {
  const artifact = getArtifactInfo()
  if (artifact == null) {
    alert('failed to obtain artifact info')
    return
  }

  const { groupId, artifactId, version } = artifact

  logger.info('download artifact:', artifact)
  window.open(`${BASE_URL}/${groupId.split('.').join('/')}/${artifactId}/${version}/${artifactId}-${version}.jar`, '_blank')
}

const downloadBtn = document.createElement('button')

downloadBtn.classList.add('nx-btn', 'nx-tile-button', 'SummaryView_downloadBtn', 'nx-btn', 'nx-btn--tertiary')
downloadBtn.innerText = 'Download'
downloadBtn.title = 'Download artifact'
downloadBtn.addEventListener('click', downloadArtifact)

function updateLayout(): void {
  const summaryView = document.querySelector(SELECTOR_SUMMARY)
  if (summaryView == null) {
    logger.debug('failed to find summary view')
    return
  }

  if (!summaryView.contains(downloadBtn)) summaryView.appendChild(downloadBtn)
}

window.addEventListener('load', () => {
  updateLayout()

  const observer = new MutationObserver(updateLayout)
  observer.observe(document.body, { childList: true, subtree: true })
})