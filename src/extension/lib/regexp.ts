export const buildHostnameRegexp = (patterns: string[]): RegExp => {
  return new RegExp('^([A-Za-z0-9-_.]*)(' + patterns.map(p => `(?:${p})`).join('|') + ')$')
}

export const buildPathnameRegexp = (patterns: string[]): RegExp => {
  return new RegExp('^(' + patterns.map(p => `(?:${p})`).join('|') + ')(/|\\?|&|$)')
}