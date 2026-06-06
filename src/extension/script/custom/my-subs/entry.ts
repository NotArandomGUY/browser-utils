import Logger from '@ext/lib/logger'

const logger = new Logger('MySubsDL')

logger.info('injected')

const parseUrl = (url: string): URL => {
  return new URL(url, document.querySelector('base')?.href ?? location.href)
}

const processDownloadPage = (html: string): void => {
  const url = JSON.parse(/URL\s*=\s*(".*?")/m.exec(html)?.[1] ?? 'null')
  if (!url) throw new Error('unable to locate url')

  open(parseUrl(url), 'blank_')
}

const interceptDownloadLink = (node: HTMLAnchorElement): void => {
  node.addEventListener('click', event => {
    event.preventDefault()

    fetch(parseUrl(node.href))
      .then(response => response.text())
      .then(processDownloadPage)
      .catch(error => logger.warn('failed to handle download link:', error))
  })
}

window.addEventListener('load', () => {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/downloads/"]').forEach(interceptDownloadLink)
})