import { entries } from '@ext/global/object'

export const buildHostnameRegexp = (patterns: string[]): RegExp => {
  return new RegExp('^([A-Za-z0-9-_.]*)(' + patterns.map(p => `(?:${p})`).join('|') + ')$')
}

export const buildPathnameRegexp = (patterns: string[]): RegExp => {
  return new RegExp('^(' + patterns.map(p => `(?:${p})`).join('|') + ')(/|\\?|&|$)')
}

export const findMethodEntryByRegexp = <T extends object, K extends keyof T = keyof T>(target: T, pattern: RegExp): [K, T[K]] | null => {
  return entries(target).find(([_key, value]) => typeof value === 'function' && pattern.test(String(value))) as [K, T[K]]
}