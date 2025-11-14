import CopyPlugin from 'copy-webpack-plugin'
import { createHash } from 'crypto'
import { join } from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { Configuration, EntryObject, ProvidePlugin } from 'webpack'
import merge from 'webpack-merge'
import ExtensionPackerPlugin from './plugin/extension-packer'

const { version } = require('../package.json')

const CHUNK_GLOBAL_SEED = `bu-build-${version}.${Math.floor(Date.now() / (24 * 60e3))}`
const CHUNK_GLOBAL_HASH = createHash('md5').update(CHUNK_GLOBAL_SEED).digest('hex')
const CHUNK_GLOBAL_ID = `__wprt_${CHUNK_GLOBAL_HASH.slice(0, 16)}__`

function generateEntries(scripts: string[] | { [output: string]: string }, srcDir: string, dstDir: string): EntryObject {
  srcDir = join(__dirname, `../src/${srcDir}`)

  if (Array.isArray(scripts)) {
    return Object.fromEntries(scripts.map(script => [`${dstDir}/${script}`, `${srcDir}/${script}`]))
  }
  return Object.fromEntries(Object.entries(scripts).map(entry => [`${dstDir}/${entry[0]}`, `${srcDir}/${entry[1]}`]))
}

function createConfig(prefix: string, config: Configuration): Configuration {
  return merge({
    output: {
      chunkLoadingGlobal: CHUNK_GLOBAL_ID,
      path: join(__dirname, `../dist/${prefix}`),
      filename: '[name].js'
    },
    optimization: {
      chunkIds: 'total-size',
      mangleExports: 'size',
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
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
          }
        })
      ]
    },
    module: {
      rules: [
        {
          test: /(?<!\.d)\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader', options: { injectType: 'lazyStyleTag' } }, 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      plugins: [new TsconfigPathsPlugin({ configFile: join(__dirname, '../tsconfig.json') })]
    }
  }, config)
}

export default [
  createConfig('extension', {
    entry: generateEntries(['worker', 'preload'], 'extension', ''),
    plugins: [
      new ExtensionPackerPlugin(version),
      new CopyPlugin({
        patterns: [
          {
            from: '.',
            to: '.',
            context: `public/extension`,
            transform: {
              transformer(data, path) {
                if (!path.endsWith('manifest.json')) return data

                return JSON.stringify({
                  ...JSON.parse(new TextDecoder().decode(data)),
                  version
                })
              }
            }
          }
        ]
      })
    ]
  }),
  createConfig('webapp', {
    entry: generateEntries(['main'], 'webapp', ''),
    output: {
      chunkFormat: false
    },
    plugins: [
      new CopyPlugin({ patterns: [{ from: '.', to: '.', context: `public/webapp` }] }),
      new ProvidePlugin({
        $: require.resolve('jquery'),
        jQuery: require.resolve('jquery'),
        'window.jQuery': require.resolve('jquery')
      })
    ]
  })
]