import CopyPlugin from 'copy-webpack-plugin'
import { createHash } from 'crypto'
import { existsSync } from 'fs'
import { join } from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { Configuration, EntryObject, ProvidePlugin } from 'webpack'
import merge from 'webpack-merge'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import { DEFAULT_SCRIPT_CONFIG, SITE_SCRIPT_CONFIG, ScriptConfig } from '../src/extension/script/config'

const CHUNK_GLOBAL_SEED = `bu-build-${Math.floor(Date.now() / (24 * 60e3))}`
const CHUNK_GLOBAL_HASH = createHash('md5').update(CHUNK_GLOBAL_SEED).update(JSON.stringify(DEFAULT_SCRIPT_CONFIG)).update(JSON.stringify(SITE_SCRIPT_CONFIG)).digest('hex')
const CHUNK_GLOBAL_ID = `__wprt_${CHUNK_GLOBAL_HASH}__`

const EMC_KEY = createHash('md5').update(CHUNK_GLOBAL_SEED).update(CHUNK_GLOBAL_ID).digest()

type ValidScriptConfig = ScriptConfig & { _filename: string }

const SCRIPT_PATH_SUFFIX = ['.ts', '/index.ts']
const env = {
  DEFAULT_SCRIPT_CONFIG: DEFAULT_SCRIPT_CONFIG.filter(mapScriptConfig.bind(null, 'default')) as ValidScriptConfig[],
  SITE_SCRIPT_CONFIG: SITE_SCRIPT_CONFIG.filter(mapScriptConfig.bind(null, 'site')) as ValidScriptConfig[]
}

function mapScriptConfig(prefix: string, config: ScriptConfig): boolean {
  const pathPrefix = join(__dirname, `../src/extension/script/${prefix}/${config.script}`)

  for (const pathSuffix of SCRIPT_PATH_SUFFIX) {
    const path = `${pathPrefix}${pathSuffix}`
    if (!existsSync(path)) continue

    Object.defineProperty(config, '_filename', { enumerable: false, value: path })
    return true
  }

  return false
}

function normalizeScriptName(script: string): string {
  return script.replace(/[./]/g, '_')
}

function generateEntries(scripts: string[] | { [output: string]: string }, srcDir: string, dstDir: string): EntryObject {
  if (Array.isArray(scripts)) {
    const absSrcDir = join(__dirname, `../src/${srcDir}`)
    scripts = Object.fromEntries(scripts.map(script => [script, join(absSrcDir, script)]))
  }

  return Object.fromEntries(Object.entries(scripts).map(e => [`js/${dstDir}/${normalizeScriptName(e[0])}`.replace(/\/+/g, '/'), e[1]]))
}

function generateScriptEntries(prefix: string, scripts: ValidScriptConfig[]): EntryObject {
  return generateEntries(Object.fromEntries(scripts.map(config => [config.script, config._filename])), `extension/script/${prefix}`, prefix)
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
              module: true
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
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: '.', to: '.', context: `public/${prefix}` }
        ],
        options: {}
      })
    ]
  }, config)
}

export default [
  createConfig('extension', {
    entry: generateEntries(['worker'], 'extension', ''),
    plugins: [
      new VirtualModulesPlugin({
        'node_modules/@virtual/emc-key': `module.exports={EMC_KEY:new Uint8Array([${EMC_KEY.join(',')}])}`,
        'node_modules/@virtual/script-config': `module.exports=${JSON.stringify(env)}`
      })
    ]
  }),
  createConfig('extension', {
    entry: generateEntries(['isolated'], 'extension/script/preload', 'preload'),
    plugins: [
      new VirtualModulesPlugin({
        'node_modules/@virtual/emc-key': `module.exports={EMC_KEY:new Uint8Array([${EMC_KEY.join(',')}])}`
      })
    ]
  }),
  createConfig('extension', {
    entry: {
      ...generateEntries(['main'], 'extension/script/preload', 'preload'),
      ...generateScriptEntries('default', env.DEFAULT_SCRIPT_CONFIG),
      ...generateScriptEntries('site', env.SITE_SCRIPT_CONFIG)
    },
    optimization: {
      runtimeChunk: {
        name: 'js/runtime'
      },
      splitChunks: {
        cacheGroups: {
          default: false,
          defaultVendors: {
            name: 'vendor',
            filename: 'js/vendor.js',
            chunks: 'all',
            minChunks: 2
          }
        }
      }
    },
    plugins: [
      new VirtualModulesPlugin({
        'node_modules/@virtual/emc-key': `module.exports={EMC_KEY:new Uint8Array([${EMC_KEY.join(',')}])}`,
        'node_modules/@virtual/wprt': `module.exports=${JSON.stringify({ CHUNK_GLOBAL_ID })}`
      })
    ]
  }),
  createConfig('webapp', {
    entry: generateEntries(['main'], 'webapp', ''),
    output: {
      chunkFormat: false
    },
    plugins: [
      new ProvidePlugin({
        $: require.resolve('jquery'),
        jQuery: require.resolve('jquery'),
        'window.jQuery': require.resolve('jquery')
      })
    ]
  })
] satisfies Configuration[]