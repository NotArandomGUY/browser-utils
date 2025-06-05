const CHARS_A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const CHARS_N = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

function getRandomValues(size: number, key?: string) {
  const rand = new Uint8Array(size)

  if ('crypto' in window && 'getRandomValues' in window.crypto) {
    try {
      window.crypto.getRandomValues(rand)
      return Array.from(rand)
    } catch { }
  }

  for (let i = 0; i < size; i++) {
    const now = Date.now()
    for (let j = 0; j < now % 23; j++) Math.random() // NOSONAR
    rand[i] = Math.floor(Math.random() * 256)
  }

  if (key) {
    for (let ri = 1, ki = 0; ki < key.length; ri++, ki++) {
      rand[ri % size] ^= (rand[(ri - 1) % size] / 4) ^ key.charCodeAt(ki)
    }
  }

  return Array.from(rand)
}

function swap<T>(array: Array<T>, indexL: number, indexR: number): void {
  if (array.length === 0) return

  indexL %= array.length
  indexR %= array.length

  const v = array[indexL]
  array[indexL] = array[indexR]
  array[indexR] = v
}

function rotateLeft<T>(amount: number, array: Array<T>): void {
  array.splice(0, amount % array.length).forEach(v => array.push(v))
}

function rotateRight<T>(amount: number, array: Array<T>): void {
  array.splice(-(amount % array.length)).reverse().forEach(v => array.unshift(v))
}

function decode(key: string, chars: string, data: string[]): void {
  const temp = key.split('')
  data.forEach((char, i) => {
    char = chars[(chars.indexOf(char) - chars.indexOf(temp[i]) + chars.length) % chars.length]
    temp.push(char)
    data[i] = char
  })
}

function encode(key: string, chars: string, data: string[]): void {
  const temp = key.split('')
  data.forEach((char, i) => {
    temp.push(char)
    char = chars[(chars.indexOf(char) + chars.indexOf(temp[i])) % chars.length]
    data[i] = char
  })
}

export function getNonce(size: number) {
  return getRandomValues(size).map(v => CHARS_A[v % CHARS_A.length]).join('')
}

export function decodeTrackingParam(trackingParam: string): string {
  const data = trackingParam.split('')
  data.reverse()
  swap(data, 0, 15)
  rotateRight(12, data)
  decode('continuation', CHARS_A, data)
  decode('response', CHARS_N, data)
  return data.join('')
}

export function encodeTrackingParam(trackingParam: string): string {
  const data = trackingParam.split('')
  encode('response', CHARS_N, data)
  encode('continuation', CHARS_A, data)
  rotateLeft(12, data)
  swap(data, 0, 15)
  data.reverse()
  return data.join('')
}