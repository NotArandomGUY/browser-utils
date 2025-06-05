import Logger from '@ext/lib/logger'

const logger = new Logger('BMBypass')

logger.info('injected')

function decryptHash(inp: string): string {
  let out = ''
  for (let i = inp.length / 2 - 5; i >= 0; i = i - 2) out += inp[i]
  for (let i = inp.length / 2 + 4; i < inp.length; i = i + 2) out += inp[i]
  return out
}

window.addEventListener('load', () => {
  logger.info('getting hash...')

  const args = Array.from(document.querySelectorAll('script'))
    .map(s => s.innerText)
    .find(s => (/Button\(['"]/).test(s))
    ?.match(/(?<=Button\().*?(?=\))/)?.[0]
    ?.split(',')?.map(a => a.trim().slice(1, -1))

  const hash = args?.[0]
  if (hash == null) {
    logger.error('error: hash not found.')
    return
  }

  logger.info('got hash:', hash)
  location.assign(`${location.protocol}//${location.host}/get-url.php?url=${encodeURIComponent(decryptHash(hash))}`)
})
