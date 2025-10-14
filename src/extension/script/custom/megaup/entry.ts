import { round } from '@ext/global/math'
import Logger from '@ext/lib/logger'

const logger = new Logger('MUPBypass')

logger.info('injected')

function decryptHash(inp1: string, inp2: string): string {
  let out = ''
  for (let i = inp1.length / 4 - 1; i >= 0; i--) {
    out += inp1[i]
  }
  for (let i = inp1.length / 4 * 3 - 1; i >= inp1.length / 4 * 2; i--) {
    out += inp1[i]
  }
  for (let i = (inp2.length - 3) / 2 + 2; i >= 3; i--) {
    out += inp2[i]
  }

  const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  if (width <= 0 || height <= 0) {
    out += out[round(out.length / 3)]
    out += out[round(out.length / 2)]
  }

  return out
}

function startRedirectLoop(): void {
  const timer = setInterval(() => {
    const nextUrl = document.querySelector<HTMLAnchorElement>('.download-timer>a')?.href
    if (nextUrl == null) return

    window.location.replace(nextUrl)
    clearInterval(timer)
  }, 1e3)
}

function doMethod1(): boolean {
  logger.info('getting file info...')

  const args = Array.from(document.querySelectorAll('script'))
    .map(s => s.innerText)
    .find(s => (/Mhoa_URL\(['"]/).test(s))
    ?.match(/(?<=Mhoa_URL\().*?(?=\);)/)?.[0]
    ?.split(',')?.map(a => a.trim().slice(1, -1))

  if (args?.length === 4) {
    const [d1, d2, name, size] = args

    logger.info('got file info:', args)
    location.assign(`https://download.megaup.net/?idurl=${encodeURIComponent(decryptHash(d1, d2))}&idfilename=${encodeURIComponent(name)}&idfilesize=${encodeURIComponent(size)}`)
    return true
  } else {
    logger.error('error: file info not found.')
    return false
  }
}

function doMethod2(): boolean {
  const url = Array.from(document.querySelectorAll('script'))
    .map(s => s.innerText)
    .find(s => (/https:\/\/mega.*?\..+?\//).test(s))
    ?.match(/(?<=')https:\/\/mega.*?\..+?\/.*?(?=')/)?.[0]

  if (url == null) {
    logger.error('error: redirect url not found')
    return false
  }

  window.location.replace(url)
  return true
}

window.addEventListener('load', () => {
  if (location.hash.includes('mb')) {
    logger.info('should be downloading, stop!')
    return
  }

  if (location.search.includes('?pt')) {
    logger.info('wait for 5s...')
    setTimeout(() => {
      location.hash = 'mb'
      location.reload()
    }, 5e3)
    return
  }

  startRedirectLoop()

  if (doMethod1()) logger.info('method 1 success')
  else if (doMethod2()) logger.info('method 2 success')
  else logger.error('error: all method failed')
})