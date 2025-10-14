require('tsconfig-paths').register()

import { assign, entries, keys } from '@ext/global/object'
import { bufferConcat, bufferToString } from '@ext/lib/buffer'
import RemoteBranch from '@ext/proto/remote/branch'
import RemotePackage from '@ext/proto/remote/package'
import ScriptConfig from '@ext/proto/script/config'
import ScriptEntry from '@ext/proto/script/entry'
import ScriptPackage from '@ext/proto/script/package'
import { createCipheriv, createHash, createPrivateKey, createPublicKey, generateKeyPairSync, getRandomValues, KeyObject, sign } from 'crypto'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { cwd } from 'process'
import { Compilation, Compiler, EntryNormalized, sources } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import { deflateSync, inflateSync } from 'zlib'

interface IBranchConfigEntry {
  id: string
  url: string | null
  encrypt: boolean
}

interface IBranchConfig {
  selected: string
  branches: IBranchConfigEntry[]
}

const PLUGIN_NAME = 'ExtensionPackerPlugin'
const RUNTIME_SCRIPTS = ['runtime', 'vendor']
const SCRIPT_PREFIXES = ['common', 'custom']
const DEFAULT_BRANCH_CONFIG = {
  id: 'main',
  url: null,
  encrypt: false
} satisfies IBranchConfigEntry

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getScriptId(path: string): string {
  const hash = createHash('sha256').update(path).digest()
  const shift = (hash[0] ^ hash[hash.length - 1]) % hash.length
  const overflow = Math.max(0, 8 - (hash.length - shift))

  return `${toHex(hash.subarray(shift, shift + 8 - overflow))}${toHex(hash.subarray(0, overflow))}`
}

function getBranchConfig(): IBranchConfig {
  try {
    const config = JSON.parse(readFileSync(join(cwd(), 'dist/extension/package/branch.json'), 'utf8')) as IBranchConfig
    if (config == null || !Array.isArray(config.branches)) throw new Error('invalid branch config')

    config.branches = config.branches.map(entry => ({
      id: String(entry.id),
      url: String(entry.url ?? '') || null,
      encrypt: !!entry.encrypt
    }))

    const entry = config.branches.find(entry => entry.id === config.selected) ?? config.branches[0]
    if (entry == null || typeof entry !== 'object') throw new Error('no valid branch available')

    config.selected = entry.id

    console.log(`[${PLUGIN_NAME}]`, `using '${config.selected}' branch config`)

    return config
  } catch (error) {
    console.log(`[${PLUGIN_NAME}]`, `using default branch config (reason: ${error instanceof Error ? error.message : String(error)})`)

    return {
      selected: DEFAULT_BRANCH_CONFIG.id,
      branches: [DEFAULT_BRANCH_CONFIG]
    }
  }
}

function buildVirtualModules(modules: Record<string, string | object>): Record<string, string> {
  const files: Record<string, string> = {}

  for (const name in modules) {
    const prefix = `node_modules/@virtual/${name}`

    let module = modules[name]
    if (typeof module !== 'string') {
      module = [
        'import { bufferFromString } from "@ext/lib/buffer"',
        ...entries(module).map(e => [
          `export const ${e[0]}`,
          e[1] instanceof Uint8Array ? `bufferFromString(atob('${btoa(bufferToString(e[1], 'latin1'))}'), 'latin1')` : JSON.stringify(e[1])
        ].join('='))
      ].join(';')
    }

    const hash = createHash('md5').update(module).digest()

    files[`${prefix}/package.json`] = JSON.stringify({ name, version: `${hash.readUint32LE(0)}.${hash.readUint32LE(4)}.${hash.readUint32LE(8)}`, main: 'main.js' })
    files[`${prefix}/main.js`] = module
  }

  return files
}

export default class ExtensionPackerPlugin {
  private rpk: InstanceType<typeof RemotePackage>
  private spk: InstanceType<typeof ScriptPackage>
  private branch: InstanceType<typeof RemoteBranch>
  private key: KeyObject
  private virtualModules: VirtualModulesPlugin

  public constructor(version: string, virtualModules: Record<string, string | object> = {}) {
    const branchConfig = getBranchConfig()

    // Create/Load remote package
    const rpk = new RemotePackage({})
    try {
      rpk.deserialize(inflateSync(readFileSync(join(cwd(), 'dist/extension/package/cache/config.rpk'))), true)

      if (rpk.version !== version) throw new Error('version changed')
    } catch (error) {
      console.log(`[${PLUGIN_NAME}]`, `creating package config... (reason: ${error instanceof Error ? error.message : String(error)})`)

      rpk.version = version

      // Refresh signing key on version change
      rpk.branches?.forEach(b => {
        b.publicKey = null
        b.privateKey = null
      })
    }
    rpk.branches ??= []

    // Update remote package branches by config
    for (const { id, url, encrypt } of branchConfig.branches) {
      let branch = rpk.branches.find(branch => branch.id === id)
      if (branch == null) {
        branch = new RemoteBranch({ id })
        rpk.branches.push(branch)
      }

      branch.url = url
      branch.encryptKey = encrypt ? (branch.encryptKey ?? getRandomValues(new Uint8Array(32))) : null

      let privateKey: KeyObject | null = null
      if (branch.privateKey == null) {
        console.log(`[${PLUGIN_NAME}]`, `generating private key for branch '${id}'...`)

        privateKey = generateKeyPairSync('ed25519').privateKey
        branch.privateKey = privateKey.export({ type: 'pkcs8', format: 'der' })
      }
      if (branch.publicKey == null) {
        console.log(`[${PLUGIN_NAME}]`, `extracting public key for branch '${id}'...`)

        if (privateKey == null) privateKey = createPrivateKey({ key: Buffer.from(branch.privateKey), type: 'pkcs8', format: 'der' })
        branch.publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'der' })
      }
    }
    rpk.branches = rpk.branches.filter(branch => branchConfig.branches.find(entry => entry.id === branch.id) != null)

    // Find selected branch
    const branch = rpk.branches.find(branch => branch.id === branchConfig.selected) ?? null
    if (branch == null) throw new Error(`branch '${branchConfig.selected}' not found`)
    if (branch.privateKey == null) throw new Error(`branch '${branch.id}' missing private key`)

    const key = createPrivateKey({ key: Buffer.from(branch.privateKey), type: 'pkcs8', format: 'der' })

    // Create script package
    const spk = new ScriptPackage({
      version: `${version}.${Math.floor(Date.now() / 1e3)}`,
      entries: []
    })

    spk.entries!.unshift(...RUNTIME_SCRIPTS.map(entry => new ScriptEntry({ id: getScriptId(entry) })))

    this.rpk = rpk
    this.spk = spk
    this.branch = branch
    this.key = key
    this.virtualModules = new VirtualModulesPlugin(buildVirtualModules(virtualModules))
  }

  public apply(compiler: Compiler) {
    const { rpk, spk, branch, key, virtualModules } = this

    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      const entryPoints: EntryNormalized = {}

      console.log(`[${PLUGIN_NAME}]`, 'scanning script entries...')

      for (const prefix of SCRIPT_PREFIXES) {
        const dir = join(cwd(), `src/extension/script/${prefix}`)
        const dirEntries = readdirSync(dir)
        for (const entry of dirEntries) {
          const configPath = join(dir, entry, 'entry.config.ts')
          if (!statSync(configPath, { throwIfNoEntry: false })?.isFile) {
            console.warn(`[${PLUGIN_NAME}]`, `script ${prefix}/${entry} missing config`)
            continue
          }

          const config = require(configPath)?.default
          if (config == null || typeof config !== 'object') {
            console.warn(`[${PLUGIN_NAME}]`, `script ${prefix}/${entry} config invalid`)
            continue
          }
          const scriptId = getScriptId(`${prefix}/${entry}`)

          entryPoints[`package/cache/${scriptId}`] = {
            runtime: `package/cache/${spk.entries![0].id}`, // runtime
            import: [`extension/script/${prefix}/${entry}/entry`]
          }

          spk.entries!.push(new ScriptEntry({
            id: scriptId,
            config: new ScriptConfig(config)
          }))
        }
      }

      console.log(`[${PLUGIN_NAME}]`, `found ${keys(entryPoints).length} script entries`)

      // Inject compiler options for package
      assign(compiler.options.entry, entryPoints)
      compiler.options.optimization.splitChunks = {
        automaticNameDelimiter: '-',
        cacheGroups: {
          default: false,
          defaultVendors: {
            name: `package/cache/${spk.entries![1].id}`, // vendor
            minChunks: 2,
            chunks(chunk) {
              for (let group of chunk.groupsIterable) {
                while (group) {
                  const parent = group.getParents()[0]
                  if (parent == null) break

                  group = parent
                }

                if (group.name?.startsWith('package/cache/')) return true
              }

              return false
            }
          }
        },
        chunks: 'async',
        defaultSizeTypes: ['javascript', 'unknown'],
        enforceSizeThreshold: 50000,
        hidePathInfo: true,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        minChunks: 1,
        minSize: 20000,
        usedExports: true
      }
    })

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      const chunkGlobalId = compiler.options.output.chunkLoadingGlobal ?? '__unknown__'

      // Generate message key
      spk.messageKey = getRandomValues(new Uint8Array(32))

      // Generate package virtual module
      entries(buildVirtualModules({
        'package': {
          CHUNK_GLOBAL_ID: chunkGlobalId,
          MESSAGE_KEY: spk.messageKey
        },
        'extension': {
          HANDSHAKE_KEY: new Uint8Array(createHash('md5').update(chunkGlobalId).digest())
        }
      })).forEach(e => virtualModules.writeModule(e[0], e[1]))

      // Build package after compilation & optimize complete
      compilation.hooks.processAssets.tap({ name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER }, () => {
        console.log(`[${PLUGIN_NAME}]`, 'building package...')

        spk.entries!.map(entry => {
          const source = compilation.getAsset(`package/cache/${entry.id}.js`)?.source
          if (source == null) {
            console.warn(`[${PLUGIN_NAME}]`, `missing source for script '${entry.id}'`)
            return
          }

          entry.code = source.buffer()
        })

        console.log(`[${PLUGIN_NAME}]`, 'signing package...')

        spk.sign = sign(null, spk.serialize(), key)

        compilation.emitAsset('package/cache/config.rpk', new sources.RawSource(deflateSync(rpk.serialize())))
        rpk.branches?.forEach(b => b.privateKey = null)

        const branchId = branch.id ?? DEFAULT_BRANCH_CONFIG.id
        compilation.emitAsset('package/branch.json', new sources.RawSource(JSON.stringify({
          selected: branchId,
          branches: rpk.branches?.map(b => ({
            id: b.id,
            url: b.url,
            encrypt: b.encryptKey != null
          })) ?? []
        } as IBranchConfig, null, 2)))

        let data = deflateSync(spk.serialize())
        if (branch.encryptKey != null) {
          if (branch.publicKey == null) throw new Error('missing public key')
          const cipher = createCipheriv('aes-256-cbc', branch.encryptKey, branch.publicKey.subarray(0, 16))
          data = Buffer.from(bufferConcat([cipher.update(data), cipher.final()]))
        }
        compilation.emitAsset(`package/${branchId}.spk`, new sources.RawSource(data))

        compilation.emitAsset('extension.rpk', new sources.RawSource(deflateSync(rpk.serialize())))
      })
    })

    virtualModules.apply(compiler)
  }
}