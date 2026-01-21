import { MinifyOptions } from 'terser'

export const TERSER_OPTIONS = {
  compress: {
    passes: 2
  },
  mangle: {
    module: true,
    properties: {
      keep_quoted: true,
      regex: /[A-Za-z0-9]+_$/
    }
  },
  format: {
    comments: false
  }
} satisfies MinifyOptions