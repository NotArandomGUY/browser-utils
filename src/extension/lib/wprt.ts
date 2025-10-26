import { floor, random } from '@ext/global/math'
import { assign, defineProperties, defineProperty, fromEntries, getOwnPropertyNames, getPrototypeOf, keys } from '@ext/global/object'
import Hook, { HookResult } from '@ext/lib/intercept/hook'
import Logger from '@ext/lib/logger'
import { proxyBind } from '@ext/lib/proxy/bind'
import { CHUNK_GLOBAL_ID } from '@virtual/package'


type ChunkID = string | number
type ModuleID = string | number
type ModuleFactory = (module: Module, exports: object, require: RuntimeProxy) => void
type ModuleFactoryMap = { [moduleId: ModuleID]: ModuleFactory }
type ModuleMap = { [moduleId: ModuleID]: Module }
type ModuleAliasMap = { [moduleId: ModuleID]: ModuleID }
type DeferredChunkData = [ChunkID[], () => any, number]
type LoadingChunkData = [ChunkID[], ModuleFactoryMap, (require: RuntimeProxy) => number]
type ESModuleLike = { __esModule: any;[key: string]: any }
type NodeModuleLike = { paths: string[]; children: any[] }


enum RuntimeField {
  publicPath = 'p',
  entryModuleId = 's',
  moduleCache = 'c',
  moduleFactories = 'm',
  ensureChunk = 'e',
  ensureChunkHandlers = 'f',
  prefetchChunk = 'E',
  prefetchChunkHandlers = 'F',
  preloadChunk = 'G',
  preloadChunkHandlers = 'H',
  definePropertyGetters = 'd',
  makeNamespaceObject = 'r',
  createFakeNamespaceObject = 't',
  compatGetDefaultExport = 'n',
  harmonyModuleDecorator = 'hmd',
  nodeModuleDecorator = 'nmd',
  getFullHash = 'h',
  wasmInstances = 'w',
  instantiateWasm = 'v',
  uncaughtErrorHandler = 'oe',
  scriptNonce = 'nc',
  loadScript = 'l',
  createScript = 'ts',
  createScriptUrl = 'tu',
  getTrustedTypesPolicy = 'tt',
  chunkName = 'cn',
  runtimeId = 'j',
  getChunkScriptFilename = 'u',
  getChunkCssFilename = 'k',
  getChunkUpdateScriptFilename = 'hu',
  getChunkUpdateCssFilename = 'hk',
  getMiniCssChunkFilename = 'miniCssF',
  startup = 'x',
  startupEntrypoint = 'X',
  onChunksLoaded = 'O',
  externalInstallChunk = 'C',
  interceptModuleExecution = 'i',
  global = 'g',
  shareScopeMap = 'S',
  initializeSharing = 'I',
  currentRemoteGetScope = 'R',
  getUpdateManifestFilename = 'hmrF',
  hmrDownloadManifest = 'hmrM',
  hmrDownloadUpdateHandlers = 'hmrC',
  hmrModuleData = 'hmrD',
  hmrInvalidateModuleHandlers = 'hmrI',
  hmrRuntimeStatePrefix = 'hmrS',
  amdDefine = 'amdD',
  amdOptions = 'amdO',
  system = 'System',
  hasOwnProperty = 'o',
  systemContext = 'y',
  baseURI = 'b',
  relativeUrl = 'U',
  asyncModule = 'a'
}

interface RuntimeChunkLoadedFn {
  <T>(result: T): T
  <T>(result: T, chunkIds: ChunkID[], fn: () => T, priority: number): T
}

interface RuntimeProxy {
  (this: WebpackRuntime, moduleId: ModuleID): object
  [RuntimeField.publicPath]: string
  [RuntimeField.entryModuleId]: ModuleID
  [RuntimeField.moduleCache]: ModuleMap
  [RuntimeField.moduleFactories]: ModuleFactoryMap
  [RuntimeField.ensureChunk](chunkId: ChunkID): Promise<[]>
  [RuntimeField.ensureChunkHandlers]: { [id: string]: (chunkId: ChunkID, promises: Promise<unknown>[]) => void }
  // [RuntimeField.prefetchChunk]
  // [RuntimeField.prefetchChunkHandlers]
  // [RuntimeField.preloadChunk]
  // [RuntimeField.preloadChunkHandlers]
  [RuntimeField.definePropertyGetters](exports: any, ...args: any[]): void
  [RuntimeField.makeNamespaceObject](exports: any): void
  [RuntimeField.createFakeNamespaceObject](value: any, mode: number): object
  [RuntimeField.compatGetDefaultExport](module: ESModuleLike): () => object
  [RuntimeField.harmonyModuleDecorator](module: object | null): object
  [RuntimeField.nodeModuleDecorator](module: NodeModuleLike): NodeModuleLike
  // [RuntimeField.getFullHash]
  // [RuntimeField.wasmInstances]
  // [RuntimeField.instantiateWasm]
  // [RuntimeField.uncaughtErrorHandler]
  [RuntimeField.scriptNonce]: string | null
  [RuntimeField.loadScript](url: string, done: (evt: Event) => void, key: string | undefined, chunkId: ChunkID): void
  [RuntimeField.createScript](input: string): TrustedScript | undefined
  [RuntimeField.createScriptUrl](input: string): TrustedScriptURL | undefined
  [RuntimeField.getTrustedTypesPolicy](): Partial<TrustedTypePolicy> | null
  // [RuntimeField.chunkName]: never
  // [RuntimeField.runtimeId]: never
  [RuntimeField.getChunkScriptFilename](chunkId: ChunkID): string
  // [RuntimeField.getChunkCssFilename]
  // [RuntimeField.getChunkUpdateScriptFilename]
  // [RuntimeField.getChunkUpdateCssFilename]
  [RuntimeField.getMiniCssChunkFilename](): string
  // [RuntimeField.startup]
  // [RuntimeField.startupEntrypoint]
  [RuntimeField.onChunksLoaded]: RuntimeChunkLoadedFn & { [id: string]: (chunkId: ChunkID) => boolean }
  // [RuntimeField.externalInstallChunk]
  // [RuntimeField.interceptModuleExecution]
  [RuntimeField.global]: typeof globalThis
  // [RuntimeField.shareScopeMap]: never
  // [RuntimeField.initializeSharing]: never
  // [RuntimeField.currentRemoteGetScope]: never
  // [RuntimeField.getUpdateManifestFilename]
  // [RuntimeField.hmrDownloadManifest]
  // [RuntimeField.hmrDownloadUpdateHandlers]
  // [RuntimeField.hmrModuleData]
  // [RuntimeField.hmrInvalidateModuleHandlers]
  // [RuntimeField.hmrRuntimeStatePrefix]
  // [RuntimeField.amdDefine]: never
  [RuntimeField.amdOptions]: object
  // [RuntimeField.system]: never
  [RuntimeField.hasOwnProperty](obj: any, prop: PropertyKey): boolean
  // [RuntimeField.systemContext]: never
  // [RuntimeField.baseURI]: never
  // [RuntimeField.relativeUrl]: never
  // [RuntimeField.asyncModule]: never
}

interface WebpackRuntimeConfig {
  commonId: number
  publicPath: string
  chunkPrefix: string
  dataWebpackPrefix: string
  scriptNonce: string | null
  chunkConcat: string
  miniCssFilename: string
  prefixMap: { [chunkId: ChunkID]: string } | null
  scriptMap: { [chunkId: ChunkID]: string }
  staticChunkMap: { [chunkId: ChunkID]: string }
  aliasMap: { [moduleId: ModuleID]: ModuleID }
  installedChunkList: number[]
  jsChunkList: ChunkID[]
  cssChunkList: ChunkID[]
  trustedTypePolicies: string[]
  moduleFactories: ModuleFactoryMap
  isLocal: boolean
}


const DEFAULT_RUNTIME_CONFIG: WebpackRuntimeConfig = {
  commonId: 0,
  publicPath: '',
  chunkPrefix: '',
  chunkConcat: '_',
  dataWebpackPrefix: '',
  scriptNonce: null,
  miniCssFilename: '',
  prefixMap: null,
  scriptMap: {},
  staticChunkMap: {},
  aliasMap: {},
  installedChunkList: [],
  jsChunkList: [],
  cssChunkList: [],
  trustedTypePolicies: [],
  moduleFactories: {},
  isLocal: false
}


const { error, warn, debug } = new Logger('WPRT')

const getProto: (obj: any) => any = getPrototypeOf ? ((obj: any) => getPrototypeOf(obj)) : ((obj: { __proto__: any }) => obj.__proto__)

const leafPrototypes = [null, getProto({}), getProto([]), getProto(getProto)]


export class Module {
  public runtime: WebpackRuntime
  public factory: ModuleFactory | null
  public id: number
  public name: string | null
  public isLoaded: boolean
  public exports: object

  public dependencies: Module[]
  public dependents: Module[]

  /**
   * Module constructor
   * @param {WebpackRuntime} runtime
   * @param {ModuleID} moduleId
   */
  public constructor(runtime: WebpackRuntime, moduleId: ModuleID) {
    // Resolve module id
    moduleId = Number(runtime.resolveModuleId(moduleId))

    this.runtime = runtime
    this.factory = runtime.getModuleFactory(moduleId)
    this.id = moduleId
    this.name = null
    this.isLoaded = false
    this.exports = {}

    this.dependencies = []
    this.dependents = []

    // Add module to loader cache
    runtime.setModule(moduleId, this)

    // Reverse module alias lookup
    const moduleName = runtime.moduleAlias[moduleId]
    if (moduleName == null) return

    // Set name from alias
    this.setName(String(moduleName))
  }

  /**
   * Get module name
   * @returns {string | null}
   */
  public getName(): string | null {
    return this.name ?? null
  }

  /**
   * Set module name
   * @param {string} moduleName
   * @returns {void}
   */
  public setName(moduleName: string): void {
    this.name = moduleName

    // Add module load function by name
    this.runtime.setModuleFactory(moduleName, this.factory)

    // Add module to loader cache by name
    this.runtime.setModule(moduleName, this)
  }

  /**
   * Add module dependency
   * @param {Module} module
   * @returns {void}
   */
  public addDependency(module: Module): void {
    this.dependencies.push(module)
    module.dependents.push(this)
  }

  /**
   * Load module
   * @returns {void}
   */
  public load(): void {
    const { runtime, factory, id, name, exports } = this

    // Push dependency to current loading module
    runtime.pushDependency(this)

    // Push module to laod stack
    runtime.pushLoadStack(this)

    // Notify before module load
    runtime.onBeforeModuleLoad(id)

    let threw = true
    try {
      // Check if factory exists
      if (factory == null) throw new Error(`Module ${id} factory not found [${name}]`)

      // Call module factory
      factory.call(exports, this, exports, runtime.proxy)
      threw = false
    } finally {
      if (threw) runtime.unsetModule(id)
    }

    // Notify after module load
    runtime.onAfterModuleLoad(id)

    // Flag module as loaded
    this.isLoaded = true

    // Check for error
    if (runtime.loadStackTop() !== this) throw new Error('Invalid stack state')

    // Pop module from laod stack
    runtime.popLoadStack()
  }
}


export class WebpackRuntime {
  /*************************/
  /* Native runtime fields */
  /*************************/

  public publicPath: RuntimeProxy[RuntimeField.publicPath]
  public entryModuleId: RuntimeProxy[RuntimeField.entryModuleId]
  public moduleCache: RuntimeProxy[RuntimeField.moduleCache]
  public moduleFactories: RuntimeProxy[RuntimeField.moduleFactories]
  public ensureChunkHandlers: RuntimeProxy[RuntimeField.ensureChunkHandlers]
  public scriptNonce: RuntimeProxy[RuntimeField.scriptNonce]
  public global: RuntimeProxy[RuntimeField.global]
  public amdOptions: RuntimeProxy[RuntimeField.amdOptions]

  private readonly inProgress: { [url: string]: Array<(evt: Event) => void> }
  private policy: Partial<TrustedTypePolicy> | null
  private readonly deferred: DeferredChunkData[]
  private readonly installedChunks: { [chunkId: ChunkID]: [(value?: any) => void, (reason?: any) => void, Promise<any>] | 0 }

  /*************************/
  /* Custom runtime fields */
  /*************************/

  public proxy: RuntimeProxy
  public moduleAlias: ModuleAliasMap
  public onModuleLoadedCallback: ((module: Module) => void) | null

  private readonly config: WebpackRuntimeConfig
  private readonly moduleStack: Module[]
  private firstModule: Module | null

  /**
   * Module loader constructor
   * @param {ModuleID} entryModuleId
   * @param {WebpackRuntimeConfig} config
   */
  public constructor(entryModuleId: ModuleID, config: WebpackRuntimeConfig) {
    const { publicPath, scriptNonce, aliasMap, installedChunkList, moduleFactories } = config

    this.publicPath = publicPath
    this.entryModuleId = entryModuleId
    this.moduleCache = {}
    this.moduleFactories = {}
    this.ensureChunkHandlers = {}
    this.scriptNonce = scriptNonce
    this.global = (function (this: any) {
      if (typeof globalThis === 'object') return globalThis
      try {
        return this || new Function('return this')()
      } catch (e) {
        if (typeof window === 'object') return window
      }
    })()
    this.amdOptions = {}

    this.inProgress = {}
    this.policy = null
    this.deferred = []
    this.installedChunks = fromEntries(installedChunkList.map(id => [id, 0]))

    this.proxy = this.createProxy()
    this.moduleAlias = {}
    this.onModuleLoadedCallback = null

    const ensureChunkHandlers = this.ensureChunkHandlers
    const onChunksLoaded = <RuntimeProxy[RuntimeField.onChunksLoaded]><unknown>this.onChunksLoaded

    ensureChunkHandlers[RuntimeField.runtimeId] = this.runtimeEnsureChunkHandler.bind(this)
    onChunksLoaded[RuntimeField.runtimeId] = this.runtimeIsChunkLoaded.bind(this)

    this.config = config
    this.moduleStack = []
    this.firstModule = null

    for (const key in aliasMap) {
      let moduleId: ModuleID = parseInt(key)
      if (isNaN(moduleId)) moduleId = key

      this.moduleAlias[moduleId] = aliasMap[moduleId]
      this.moduleAlias[aliasMap[moduleId]] = moduleId
    }

    for (const key in moduleFactories) {
      let moduleId: ModuleID = parseInt(key)
      if (isNaN(moduleId)) moduleId = key

      this.moduleFactories[moduleId] = moduleFactories[moduleId]
    }
  }

  /****************************/
  /* Native runtime functions */
  /****************************/

  /**
   * This file contains only the entry chunk.
   * The chunk loading function for additional chunks
   * @param {ChunkID} chunkId
   * @returns {Promise<[]>}
   */
  public ensureChunk(chunkId: ChunkID): Promise<[]> {
    const { ensureChunkHandlers } = this

    return Promise.all(keys(ensureChunkHandlers).reduce((promises, key) => {
      ensureChunkHandlers[key](chunkId, promises)
      return promises
    }, []))
  }

  /**
   * define getter functions for harmony exports
   * @param {any} exports
   * @param {any[]} args
   * @returns {void}
   */
  public definePropertyGetters(exports: any, ...args: any[]): void {
    const definition: any = {}

    if (args.length === 1) assign(definition, args[0])
    else if (args.length === 2) definition[args[0]] = args[1]
    else throw new Error('Invalid arguments')

    for (let key in definition) {
      if (this.hasOwnProperty(definition, key) && !this.hasOwnProperty(exports, key)) {
        defineProperty(exports, key, { enumerable: true, get: definition[key] })
      }
    }
  }

  /**
   * @param {any} exports
   * @returns {void}
   */
  public makeNamespaceObject(exports: any): void {
    // define __esModule on exports
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    }
    defineProperty(exports, '__esModule', { value: true })
  }

  /**
   * create a fake namespace object
   * mode & 1: value is a module id, require it
   * mode & 2: merge all properties of value into the ns
   * mode & 4: return value when already ns object
   * mode & 16: return value when it's Promise-like
   * mode & 8|1: behave like require
   * @param {any} value
   * @param {number} mode
   * @returns {object}
   */
  public createFakeNamespaceObject(value: any, mode: number): object {
    if (mode & 1) value = this.proxy(value)
    if (mode & 8) return value

    if (typeof value === 'object' && value) {
      if ((mode & 4) && value.__esModule) return value
      if ((mode & 16) && typeof value.then === 'function') return value
    }

    const ns = Object.create(null)
    this.makeNamespaceObject(ns)

    const def: any = {}

    for (let current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
      getOwnPropertyNames(current).forEach(key => {
        def[key] = () => value[key]
      })
    }

    def['default'] = () => value
    this.definePropertyGetters(ns, def)
    return ns
  }

  /**
   * getDefaultExport function for compatibility with non-harmony modules
   * @param {ESModuleLike} module
   * @returns {() => object}
   */
  public compatGetDefaultExport(module: ESModuleLike): () => object {
    const getter = module?.__esModule ?
      () => module['default'] :
      () => module
    this.definePropertyGetters(getter, { a: getter })
    return getter
  }

  /**
   * @param {object|null} module
   * @returns {object}
   */
  public harmonyModuleDecorator(module: object | null): object {
    const newModule = Object.create(module)
    if (!newModule.children) newModule.children = []
    defineProperty(newModule, 'exports', {
      enumerable: true,
      set() {
        throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + newModule.id)
      }
    })
    return newModule

  }

  /**
   * @param {NodeModuleLike} module
   * @returns {NodeModuleLike}
   */
  public nodeModuleDecorator(module: NodeModuleLike): NodeModuleLike {
    module.paths = []
    if (!module.children) module.children = []
    return module
  }

  /**
   * loadScript function to load a script via script tag
   * @param {string} url
   * @param {(evt:Event)=>void} done
   * @param {string | undefined} key
   * @param {ChunkID} _chunkId
   */
  public loadScript(url: string, done: (evt: Event) => void, key: string | undefined, _chunkId: ChunkID): void {
    const { scriptNonce, inProgress, config } = this
    const { dataWebpackPrefix } = config

    if (inProgress[url]) { inProgress[url].push(done); return }

    let script, needAttach

    if (key !== undefined) {
      const scripts = document.getElementsByTagName('script')
      for (const s of scripts) {
        if (s.getAttribute('src') == url || s.getAttribute('data-webpack') == dataWebpackPrefix + key) { script = s; break }
      }
    }

    if (!script) {
      needAttach = true
      script = document.createElement('script')
      script.charset = 'utf-8'
      // @ts-ignore: timeout might not exists
      script.timeout = 120
      if (scriptNonce) {
        script.setAttribute('nonce', scriptNonce)
      }
      script.setAttribute('data-webpack', dataWebpackPrefix + key)
      script.src = url
    }
    inProgress[url] = [done]

    let timeout: number | null = null

    const onScriptComplete = (prev: ((evt: Event) => void) | null | undefined, evt: Event | object | string): void => {
      // avoid mem leaks in IE.
      script.onerror = script.onload = null
      if (timeout != null) self.clearTimeout(timeout)
      const doneFns = inProgress[url]
      delete inProgress[url]
      script.parentNode?.removeChild(script)
      doneFns?.forEach((fn: (arg0: any) => any) => fn(evt))
      if (prev) return prev(<Event>evt)
    }

    timeout = self.setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120e3)
    script.onerror = onScriptComplete.bind(null, script.onerror)
    script.onload = onScriptComplete.bind(null, script.onload)
    if (needAttach) {
      document.head.appendChild(script)
    }
  }

  /**
   * @param {string} input
   * @returns {TrustedScript | undefined}
   */
  public createScript(input: string): TrustedScript | undefined {
    return this.getTrustedTypesPolicy()?.createScript?.(input)
  }

  /**
   * @param {string} input
   * @returns {TrustedScriptURL | undefined}
   */
  public createScriptUrl(input: string): TrustedScriptURL | undefined {
    return this.getTrustedTypesPolicy()?.createScriptURL?.(input)
  }

  /**
   * @returns {Partial<TrustedTypePolicy> | null}
   */
  public getTrustedTypesPolicy(): Partial<TrustedTypePolicy> | null {
    const { trustedTypes } = window
    const { trustedTypePolicies } = this.config

    // Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
    if (this.policy == null) {
      if (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy) {
        for (const policyName of trustedTypePolicies) {
          try {
            debug('create trusted type policy:', policyName)
            this.policy = trustedTypes.createPolicy(policyName, {
              createScript: (script: string) => script,
              createScriptURL: (url: string) => url
            })
          } catch (error) {
            warn(`could not create trusted-types policy ${policyName}`, error)
          }
        }
      }
    }

    return this.policy
  }

  /**
   * @param {ChunkID} chunkId
   * @returns {string}
   */
  public getChunkScriptFilename(chunkId: ChunkID): string {
    const {
      commonId,
      chunkPrefix,
      chunkConcat,
      prefixMap,
      scriptMap,
      staticChunkMap
    } = this.config

    if (staticChunkMap[chunkId] != null) return staticChunkMap[chunkId]
    if (prefixMap != null) return `${chunkPrefix}${prefixMap[chunkId] ?? chunkId}${chunkConcat}${scriptMap[chunkId]}.js`

    return `${commonId === chunkId ? chunkPrefix : chunkId}${chunkConcat}${scriptMap[chunkId]}.js`
  }

  /**
   * @returns {string}
   */
  public getMiniCssChunkFilename(): string {
    return this.config.miniCssFilename
  }

  public onChunksLoaded<T>(result: T): T
  public onChunksLoaded<T>(result: T, chunkIds: ChunkID[], fn: () => T, priority: number): T
  public onChunksLoaded<T>(result: T, chunkIds?: ChunkID[], fn?: () => T, priority?: number): T {
    const { deferred, onChunksLoaded } = this

    if (chunkIds) {
      priority = priority ?? 0

      let i = 0
      for (i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) {
        deferred[i] = deferred[i - 1]
      }
      deferred[i] = [chunkIds, fn ?? (() => undefined), priority]
      return result
    }

    let notFulfilled = Infinity
    for (let i = 0; i < deferred.length; i++) {
      const [chunkIds, fn, priority] = deferred[i]

      let fulfilled = true
      for (let j = 0; j < chunkIds.length; j++) {
        if (((priority & 1) === 0 || notFulfilled >= priority) && keys(onChunksLoaded).every(key => (<RuntimeProxy[RuntimeField.onChunksLoaded]><unknown>onChunksLoaded)[key](chunkIds[j]))) {
          chunkIds.splice(j--, 1)
        } else {
          fulfilled = false
          if (priority < notFulfilled) notFulfilled = priority
        }
      }

      if (fulfilled) {
        deferred.splice(i--, 1)
        const r = fn()
        if (r !== undefined) result = r
      }
    }

    return result
  }


  /**
   * @param {any} obj
   * @param {PropertyKey} prop
   * @returns {boolean}
   */
  public hasOwnProperty(obj: any, prop: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop)
  }

  /**
   * @param {((data: LoadingChunkData) => number) | 0} parentChunkLoadingFunction
   * @param {LoadingChunkData} data
   * @returns {number}
   */
  public webpackJsonpCallback(parentChunkLoadingFunction: ((data: LoadingChunkData) => number) | 0, data: LoadingChunkData): number {
    const { proxy, installedChunks } = this

    try {
      const [chunkIds, moreModules, runtime] = data

      // add "moreModules" to the modules object,
      // then flag all "chunkIds" as loaded and fire callback
      let result = -1
      if (chunkIds.some(id => (installedChunks[id] !== 0))) {
        for (const moduleId in moreModules) {
          if (this.hasOwnProperty(moreModules, moduleId)) {
            this.setModuleFactory(moduleId, moreModules[moduleId])
          } else {
            warn('has own property fail for module:', moduleId)
          }
        }
        if (runtime) result = runtime(proxy)
      }

      if (parentChunkLoadingFunction) parentChunkLoadingFunction(data)

      for (const chunkId of chunkIds) {
        const installedChunkData = installedChunks[chunkId]
        if (this.hasOwnProperty(installedChunks, chunkId) && installedChunkData) {
          installedChunkData[0]()
        }
        installedChunks[chunkId] = 0
      }

      return this.onChunksLoaded(result)
    } catch (e) {
      error('error while loading chunk:', data, installedChunks, ', error:', e)
      throw e
    }
  }

  /**
   * @param {ChunkID} chunkId
   * @param {Promise<unknown>[]} promises
   * @returns {void}
   */
  private runtimeEnsureChunkHandler(chunkId: ChunkID, promises: Promise<unknown>[]): void {
    const { publicPath, installedChunks, config, hasOwnProperty } = this
    const { jsChunkList } = config

    // JSONP chunk loading for javascript
    let installedChunkData = hasOwnProperty(installedChunks, chunkId) ? installedChunks[chunkId] : undefined

    // 0 means "already installed".
    if (installedChunkData === 0) return

    // a Promise means "currently loading".
    if (installedChunkData) {
      promises.push(installedChunkData[2])
    } else if (jsChunkList.includes(chunkId)) {
      installedChunks[chunkId] = 0
    } else {
      // setup Promise in chunk cache
      let promiseResolve: (value: any) => void, promiseReject: (reason?: any) => void
      const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve
        promiseReject = reject
      })
      installedChunkData = installedChunks[chunkId] = [promiseResolve!, promiseReject!, promise]
      installedChunkData[2] = promise
      promises.push(promise)

      // start chunk loading
      const url = publicPath + this.getChunkScriptFilename(chunkId)
      // create error before stack unwound to get useful stacktrace later
      const error = new Error()
      const loadingEnded = (event: Event): void => {
        if (!hasOwnProperty(installedChunks, chunkId)) return

        installedChunkData = installedChunks[chunkId]
        if (installedChunkData !== 0) delete installedChunks[chunkId]
        if (installedChunkData) {
          const errorType = event && (event.type === 'load' ? 'missing' : event.type)
          // @ts-ignore: optional src
          const realSrc = event?.target?.src
          error.message = 'Loading chunk ' + chunkId + ' failed.\\n(' + errorType + ': ' + realSrc + ')'
          error.name = 'ChunkLoadError'
          // @ts-ignore: extended error
          error.type = errorType
          // @ts-ignore: extended error
          error.request = realSrc
          installedChunkData[1](error)
        }
      }
      this.loadScript(url, loadingEnded, "chunk-" + chunkId, chunkId)
    }
  }

  /**
   * @param {ChunkID} chunkId
   * @returns {boolean}
   */
  private runtimeIsChunkLoaded(chunkId: ChunkID): boolean {
    return this.installedChunks[chunkId] === 0
  }

  /****************************/
  /* Custom runtime functions */
  /****************************/

  /**
   * Resolve module id alias
   * @param {ModuleID} moduleId
   * @returns {ModuleID}
   */
  public resolveModuleId(moduleId: ModuleID): ModuleID {
    return typeof moduleId === 'number' ? moduleId : (this.moduleAlias[moduleId] ?? moduleId)
  }

  /**
   * Get module factory
   * @param {ModuleID} moduleId
   * @returns {ModuleFactory | null}
   */
  public getModuleFactory(moduleId: ModuleID): ModuleFactory | null {
    return this.moduleFactories[moduleId] ?? null
  }

  /**
   * Get loaded module from cache
   * @param {ModuleID} moduleId
   * @returns {Module | null}
   */
  public getModule(moduleId: ModuleID): Module | null {
    return this.moduleCache[moduleId] ?? null
  }

  /**
   * Set module factory
   * @param {number} moduleId
   * @param {ModuleFactory | null} moduleFactory
   * @returns {void}
   */
  public setModuleFactory(moduleId: string, moduleFactory: ModuleFactory | null): void {
    if (moduleFactory == null) return

    this.moduleFactories[moduleId] = moduleFactory
  }

  /**
   * Add module to cache
   * @param {ModuleID} moduleId 
   * @param {Module | null} module 
   * @returns {void}
   */
  public setModule(moduleId: ModuleID, module: Module | null): void {
    if (module == null) return

    this.moduleCache[moduleId] = module
  }

  /**
   * Remove module from cache
   * @param {ModuleID} moduleId
   * @returns {void}
   */
  public unsetModule(moduleId: ModuleID): void {
    const module = this.getModule(moduleId)
    if (module == null) return

    delete this.moduleCache[moduleId]
  }

  /**
   * Get load stack top module
   * @returns {Module | null}
   */
  public loadStackTop(): Module | null {
    return this.moduleStack[this.moduleStack.length - 1] ?? null
  }

  /**
   * Push module to load stack
   * @param {Module} module
   * @returns {void}
   */
  public pushLoadStack(module: Module): void {
    this.moduleStack.push(module)
  }

  /**
   * Pop module from laod stack
   * @returns {void}
   */
  public popLoadStack(): void {
    this.moduleStack.pop()
  }

  /**
   * Push dependency to current loading module
   * @param {Module} module
   * @returns {void}
   */
  public pushDependency(module: Module): void {
    this.loadStackTop()?.addDependency(module)
  }

  /**
   * Before module load event handler
   * @param {ModuleID} moduleId
   * @returns {void}
   */
  public onBeforeModuleLoad(moduleId: ModuleID): void {
    const module = this.getModule(moduleId)
    if (module == null) return

    // Set first module
    if (this.firstModule == null) this.firstModule = module
  }

  /**
   * After module load event handler
   * @param {ModuleID} moduleId
   * @returns {void}
   */
  public onAfterModuleLoad(moduleId: ModuleID): void {
    const module = this.getModule(moduleId)
    if (module == null) return

    this.onModuleLoadedCallback?.(module)
  }

  /**
   * Create runtime proxy for this runtime
   * @returns {RuntimeProxy}
   */
  private createProxy(): RuntimeProxy {
    const proxy = <RuntimeProxy>this.importFn.bind(this)

    for (const field in RuntimeField) {
      if (!(field in this)) continue

      // Bind methods
      const value = this[<keyof this>field]
      if (typeof value === 'function') {
        this[<keyof this>field] = value.bind(this)
      }

      // Create field proxy
      defineProperty(proxy, RuntimeField[<keyof typeof RuntimeField>field], {
        enumerable: true,
        get: () => {
          const value = this[<keyof this>field]
          if (value == null) warn('access nullish runtime proxy field:', field)
          return value
        },
        set: (value) => {
          this[<keyof this>field] = value
        }
      })
    }

    return proxy
  }

  /**
   * The require function
   * @param {ModuleID} moduleId 
   * @returns {object}
   */
  private importFn(moduleId: ModuleID): object {
    // Check if module is in cache
    const cachedModule = this.getModule(moduleId)
    if (cachedModule != null) {
      // Push dependency to current loading module
      this.pushDependency(cachedModule)

      // Notify module import
      this.onModuleImport(moduleId)

      // Return the exports of the module
      return cachedModule.exports
    }

    // Create a new module
    const module = new Module(this, moduleId)

    // Load module
    module.load()

    // Notify module import
    this.onModuleImport(moduleId)

    // Return the exports of the module
    return module.exports
  }

  /**
   * Module import event handler
   * @param {ModuleID} moduleId
   * @returns {void}
   */
  private onModuleImport(moduleId: ModuleID): void {
    const module = this.getModule(moduleId)
    if (module == null) return

    // Import module with name by id warning
    if (typeof moduleId !== 'number') return

    const moduleName = module.getName()
    if (moduleName == null) return

    warn(`WARNING: import named module [${moduleName}] with id ${moduleId}`, module)
  }
}


export const __webpack_runtime_list__: WebpackRuntime[] = []

const INTERRUPT_ID = `__wprt_inid_${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}__`
const BYPASS_ID = `__wprt_bpid_${(((floor(random() * 0x10000) << 16) | floor(random() * 0x10000)) ^ Date.now()) >>> 0}__`

/**
 * Remove our own webpack chunk loading global
 */
export const hideOwnWebpackRuntimeFromGlobal = (): void => {
  try {
    delete self[CHUNK_GLOBAL_ID as keyof typeof self]
  } catch (error) {
    warn('failed to remove chunk loading global, error:', error)
  }
}

/**
 * Interrupt webpack runtime loading by filter function
 * @param {Function} filter
 */
export const interruptWebpackRuntime = (filter: (chunkLoadingGlobal: string) => boolean): void => {
  try {
    const globalObject = new Proxy(self, {
      get(target, prop, receiver) {
        const value = ['global', 'self', 'window'].includes(prop as string) ? receiver : target[prop as keyof typeof target]
        return typeof value === 'function' ? proxyBind(value, target) : value
      },
      set(target, prop, value) {
        if (typeof prop === 'string' && Array.isArray(value) && !value.hasOwnProperty(INTERRUPT_ID) && prop.startsWith('webpackChunk')) {
          let push = value.push
          defineProperties(value, {
            [INTERRUPT_ID]: { value: true },
            forEach: {
              value: new Hook(value.forEach).install(() => {
                if (value.hasOwnProperty(BYPASS_ID)) return HookResult.EXECUTION_IGNORE
                if (filter(prop)) {
                  defineProperty(value, BYPASS_ID, { configurable: true, value: true })
                  return HookResult.EXECUTION_IGNORE
                }

                debug(`interrupted default webpack runtime for ${String(prop)}`)
                return HookResult.EXECUTION_CONTINUE
              }).call
            },
            push: {
              get() {
                return push
              },
              set(fn) {
                if (!value.hasOwnProperty(BYPASS_ID)) return

                push = fn
                delete value[BYPASS_ID as keyof typeof value]
              }
            }
          })
        }

        defineProperty(target, prop, { configurable: true, writable: true, value })
        return true
      }
    })

    defineProperty(self, 'self', {
      configurable: true,
      get() {
        return globalObject
      },
      set() {
        return
      }
    })
  } catch (e) {
    error('override global object error:', e)
  }
}

/**
 * Create module runtime
 * @param {string | number} entryModuleId
 * @param {WebpackRuntimeConfig | null} [runtimeConfig=null]
 * @returns {object}
 */
export const createWebpackRuntime = (entryModuleId: string | number, runtimeConfig: Partial<WebpackRuntimeConfig> | null = null): object => {
  const fullRuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG, ...(runtimeConfig ?? {}) }
  const { isLocal } = fullRuntimeConfig

  debug(`init ${isLocal ? 'local' : 'global'} runtime ${entryModuleId}`, runtimeConfig)

  const __webpack_runtime__ = new WebpackRuntime(entryModuleId, fullRuntimeConfig)

  // Expose runtime
  __webpack_runtime_list__.push(__webpack_runtime__)

  // Local runtime
  if (isLocal) return __webpack_runtime__.proxy(entryModuleId)

  // Global runtime
  try {
    const chunkLoadingGlobal: LoadingChunkData[] = (<any>self)[entryModuleId] = (<any>self)[entryModuleId] ?? []

    defineProperty(chunkLoadingGlobal, BYPASS_ID, { configurable: true, value: true })
    chunkLoadingGlobal.forEach(__webpack_runtime__.webpackJsonpCallback.bind(__webpack_runtime__, 0))
    chunkLoadingGlobal.push = __webpack_runtime__.webpackJsonpCallback.bind(__webpack_runtime__, Array.prototype.push.bind(chunkLoadingGlobal))
  } catch (e) {
    error('error while loading global chunks:', e)
  }

  return {}
}

/**
 * Create module runtime from script
 * @param {string} script
 * @returns {object}
 */
export const createWebpackRuntimeFromScript = (script: string): object => {
  const entryModuleId = script.match(/(?<=self\.)webpackChunk.*?(?==)/)?.[0]
  if (entryModuleId == null) throw new Error('failed to obtain entry module id')

  const matchStr = <TDef = string>(regexp: RegExp, index: number = 0, defaultValue?: TDef): string | TDef => {
    return script.match(regexp)?.[index] ?? defaultValue ?? ''
  }

  const matchMap = (regexp: RegExp, transform?: (id: number, value: string) => string): { [id: number]: string } => {
    return fromEntries(Array.from(script.matchAll(regexp)).map(e => [parseInt(e[1]), transform?.(parseInt(e[1]), e[2]) ?? e[2]]))
  }

  const publicPath = matchStr(/(?<=\.p=").*?(?=")/)
  const chunkPrefix = matchStr(/(?<=":").*?(?="\+)/)
  const dataWebpackPrefix = matchStr(/(?<==").*?(?=",.\.l)/)
  const prefixMap = matchMap(/(\d+):"(.{8})"/g)
  const scriptMap = matchMap(/(\d+):"(.{16})"/g)
  const staticChunkMap = matchMap(/(\d+)===.\?"(.*?\.\w+?)"/g, (id, value) => value.replace(/"\+\w+\+"/, `${id}`))
  const chunkConcat = matchStr(/(?<=\+")[^"]*?(?="\+\()/)
  const miniCssFilename = matchStr(/miniCssF=.*?return"(.*?)"+}/, 1)
  const installedChunkList = Array.from(script.match(/\d+(?=:0)/g) ?? []).map(e => parseInt(e))
  const jsChunkList = script.includes('f.j') ? [
    matchStr(/(?<=else if\()\d+(?=!=.\))/, 0, matchStr(/(?<=\^\().*?(?=\)\$)/)?.split('|'))
  ].flat().map(e => parseInt(e)) : []
  const trustedTypePolicies = Array.from(script.match(/(?<=createPolicy\(").*?(?=")/) ?? [])

  return createWebpackRuntime(entryModuleId, {
    publicPath,
    chunkPrefix,
    dataWebpackPrefix,
    prefixMap,
    scriptMap,
    staticChunkMap,
    chunkConcat,
    miniCssFilename,
    installedChunkList,
    jsChunkList,
    trustedTypePolicies
  })
}
