import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { unsafePolicy } from '@ext/lib/dom'
import { FFCallbackData, FFCallbacks, FFFSMountOptions, FFFSPath, FFFSType, FFLogEvent, FFLogEventCallback, FFMessageBase, FFMessageEventCallback, FFMessageLoadConfig, FFMessageOptions, FFMessageType, FFProgressEvent, FFProgressEventCallback, FileData, FSNode, IsFirst, OK } from '@ext/lib/ffmpeg/types'

const CLASS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js'
const CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'
const IMPORT_SCRIPT_REGEXP = /(?<=importScripts\().*?(?=\))/g

let messageID = 0

const toBlobUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)

  let buffer = bufferToString(new Uint8Array(await response.arrayBuffer()), 'latin1')
  if (IMPORT_SCRIPT_REGEXP.test(buffer)) {
    buffer = [
      'const UNSAFE_POLICY_OPTIONS={createHTML:i=>i,createScript:i=>i,createScriptURL:i=>i}',
      'const unsafePolicy=(globalThis.trustedTypes?.createPolicy(`unsafe-policy-${Date.now()}`,UNSAFE_POLICY_OPTIONS)??UNSAFE_POLICY_OPTIONS)',
      buffer.replace(IMPORT_SCRIPT_REGEXP, v => `unsafePolicy.createScriptURL(${v})`)
    ].join('\n')
  }

  return URL.createObjectURL(new Blob([bufferFromString(buffer, 'latin1')], { type: response.headers.get('content-type') ?? 'application/octet-stream' }))
}

const createTrustedWorker = async (url: string): Promise<Worker> => {
  return new Worker(unsafePolicy.createScriptURL(await toBlobUrl(url)))
}

export class FFmpeg {
  #worker: Worker | null = null
  /**
   * #resolves and #rejects tracks Promise resolves and rejects to
   * be called when we receive message from web worker.
   */
  #resolves: FFCallbacks = {}
  #rejects: FFCallbacks = {}

  #logEventCallbacks: FFLogEventCallback[] = []
  #progressEventCallbacks: FFProgressEventCallback[] = []

  public loaded = false

  /**
   * register worker message event handlers.
   */
  #registerHandlers(): void {
    if (!this.#worker) return

    this.#worker.onmessage = ({ data: { id, type, data } }: FFMessageEventCallback) => {
      switch (type) {
        case FFMessageType.LOAD:
          this.loaded = true
          this.#resolves[id](data)
          break
        case FFMessageType.MOUNT:
        case FFMessageType.UNMOUNT:
        case FFMessageType.EXEC:
        case FFMessageType.FFPROBE:
        case FFMessageType.WRITE_FILE:
        case FFMessageType.READ_FILE:
        case FFMessageType.DELETE_FILE:
        case FFMessageType.RENAME:
        case FFMessageType.CREATE_DIR:
        case FFMessageType.LIST_DIR:
        case FFMessageType.DELETE_DIR:
          this.#resolves[id](data)
          break
        case FFMessageType.LOG:
          this.#logEventCallbacks.forEach((f) => f(data as FFLogEvent))
          break
        case FFMessageType.PROGRESS:
          this.#progressEventCallbacks.forEach((f) =>
            f(data as FFProgressEvent)
          )
          break
        case FFMessageType.ERROR:
          this.#rejects[id](data)
          break
      }
      delete this.#resolves[id]
      delete this.#rejects[id]
    }
  }

  /**
   * Generic function to send messages to web worker.
   */
  #send({ type, data }: FFMessageBase, trans: Transferable[] = [], signal?: AbortSignal): Promise<FFCallbackData> {
    if (!this.#worker) return Promise.reject(new Error('Not loaded'))

    return new Promise((resolve, reject) => {
      const id = messageID++
      this.#worker && this.#worker.postMessage({ id, type, data }, trans)
      this.#resolves[id] = resolve
      this.#rejects[id] = reject

      signal?.addEventListener('abort', () => reject(new DOMException(`Message # ${id} was aborted`, 'AbortError')), { once: true })
    })
  }

  /**
   * Listen to log or progress events from `ffmpeg.exec()`.
   *
   * @example
   * ```ts
   * ffmpeg.on('log', ({ type, message }) => {
   *   // ...
   * })
   * ```
   *
   * @example
   * ```ts
   * ffmpeg.on('progress', ({ progress, time }) => {
   *   // ...
   * })
   * ```
   *
   * @remarks
   * - log includes output to stdout and stderr.
   * - The progress events are accurate only when the length of
   * input and output video/audio file are the same.
   *
   * @category FFmpeg
   */
  public on(event: 'log', callback: FFLogEventCallback): void
  public on(event: 'progress', callback: FFProgressEventCallback): void
  public on(
    event: 'log' | 'progress',
    callback: FFLogEventCallback | FFProgressEventCallback
  ) {
    if (event === 'log') {
      this.#logEventCallbacks.push(callback as FFLogEventCallback)
    } else if (event === 'progress') {
      this.#progressEventCallbacks.push(callback as FFProgressEventCallback)
    }
  }

  /**
   * Unlisten to log or progress events from `ffmpeg.exec()`.
   *
   * @category FFmpeg
   */
  public off(event: 'log', callback: FFLogEventCallback): void
  public off(event: 'progress', callback: FFProgressEventCallback): void
  public off(
    event: 'log' | 'progress',
    callback: FFLogEventCallback | FFProgressEventCallback
  ) {
    if (event === 'log') {
      this.#logEventCallbacks = this.#logEventCallbacks.filter(
        (f) => f !== callback
      )
    } else if (event === 'progress') {
      this.#progressEventCallbacks = this.#progressEventCallbacks.filter(
        (f) => f !== callback
      )
    }
  }

  /**
   * Loads ffmpeg-core inside web worker. It is required to call this method first
   * as it initializes WebAssembly and other essential variables.
   *
   * @category FFmpeg
   * @returns `true` if ffmpeg core is loaded for the first time.
   */
  public async load({ signal }: FFMessageOptions = {}): Promise<IsFirst> {
    if (!this.#worker) {
      this.#worker = await createTrustedWorker(CLASS_WORKER_URL)
      this.#registerHandlers()
    }
    return this.#send(
      {
        type: FFMessageType.LOAD,
        data: {
          coreURL: await toBlobUrl(`${CORE_BASE_URL}/ffmpeg-core.js`),
          wasmURL: await toBlobUrl(`${CORE_BASE_URL}/ffmpeg-core.wasm`)
        } as FFMessageLoadConfig
      },
      undefined,
      signal
    ) as Promise<IsFirst>
  }

  /**
   * Execute ffmpeg command.
   *
   * @remarks
   * To avoid common I/O issues, ['-nostdin', '-y'] are prepended to the args
   * by default.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile('video.avi', ...);
   * // ffmpeg -i video.avi video.mp4
   * await ffmpeg.exec(['-i', 'video.avi', 'video.mp4']);
   * const data = ffmpeg.readFile('video.mp4');
   * ```
   *
   * @returns `0` if no error, `!= 0` if timeout (1) or error.
   * @category FFmpeg
   */
  public exec(args: string[], timeout = -1, { signal }: FFMessageOptions = {}): Promise<number> {
    return this.#send(
      {
        type: FFMessageType.EXEC,
        data: { args, timeout },
      },
      undefined,
      signal
    ) as Promise<number>
  }

  /**
   * Execute ffprobe command.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile('video.avi', ...);
   * // Getting duration of a video in seconds: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.avi -o output.txt
   * await ffmpeg.ffprobe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', 'video.avi', '-o', 'output.txt']);
   * const data = ffmpeg.readFile('output.txt');
   * ```
   *
   * @returns `0` if no error, `!= 0` if timeout (1) or error.
   * @category FFmpeg
   */
  public ffprobe(args: string[], timeout = -1, { signal }: FFMessageOptions = {}): Promise<number> {
    return this.#send(
      {
        type: FFMessageType.FFPROBE,
        data: { args, timeout },
      },
      undefined,
      signal
    ) as Promise<number>
  }

  /**
   * Terminate all ongoing API calls and terminate web worker.
   * `FFmpeg.load()` must be called again before calling any other APIs.
   *
   * @category FFmpeg
   */
  public terminate(): void {
    const ids = Object.keys(this.#rejects)
    // rejects all incomplete Promises.
    for (const id of ids) {
      this.#rejects[id](new Error('Terminated'))
      delete this.#rejects[id]
      delete this.#resolves[id]
    }

    if (this.#worker) {
      this.#worker.terminate()
      this.#worker = null
      this.loaded = false
    }
  }

  /**
   * Write data to ffmpeg.wasm.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile('video.avi', await fetchFile('../video.avi'));
   * await ffmpeg.writeFile('text.txt', 'hello world');
   * ```
   *
   * @category File System
   */
  public writeFile(path: string, data: FileData, { signal }: FFMessageOptions = {}): Promise<OK> {
    const trans: Transferable[] = []
    if (data instanceof Uint8Array) {
      trans.push(data.buffer)
    }
    return this.#send(
      {
        type: FFMessageType.WRITE_FILE,
        data: { path, data },
      },
      trans,
      signal
    ) as Promise<OK>
  }

  public mount(fsType: FFFSType, options: FFFSMountOptions, mountPoint: FFFSPath): Promise<OK> {
    const trans: Transferable[] = []
    return this.#send(
      {
        type: FFMessageType.MOUNT,
        data: { fsType, options, mountPoint },
      },
      trans
    ) as Promise<OK>
  }

  public unmount(mountPoint: FFFSPath): Promise<OK> {
    const trans: Transferable[] = []
    return this.#send(
      {
        type: FFMessageType.UNMOUNT,
        data: { mountPoint },
      },
      trans
    ) as Promise<OK>
  }

  /**
   * Read data from ffmpeg.wasm.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * const data = await ffmpeg.readFile('video.mp4');
   * ```
   *
   * @category File System
   */
  public readFile(path: string, encoding = 'binary', { signal }: FFMessageOptions = {}): Promise<FileData> {
    return this.#send(
      {
        type: FFMessageType.READ_FILE,
        data: { path, encoding },
      },
      undefined,
      signal
    ) as Promise<FileData>
  }

  /**
   * Delete a file.
   *
   * @category File System
   */
  public deleteFile(path: string, { signal }: FFMessageOptions = {}): Promise<OK> {
    return this.#send(
      {
        type: FFMessageType.DELETE_FILE,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>
  }

  /**
   * Rename a file or directory.
   *
   * @category File System
   */
  public rename(oldPath: string, newPath: string, { signal }: FFMessageOptions = {}): Promise<OK> {
    return this.#send(
      {
        type: FFMessageType.RENAME,
        data: { oldPath, newPath },
      },
      undefined,
      signal
    ) as Promise<OK>
  }

  /**
   * Create a directory.
   *
   * @category File System
   */
  public createDir(path: string, { signal }: FFMessageOptions = {}): Promise<OK> {
    return this.#send(
      {
        type: FFMessageType.CREATE_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>
  }

  /**
   * List directory contents.
   *
   * @category File System
   */
  public listDir(path: string, { signal }: FFMessageOptions = {}): Promise<FSNode[]> {
    return this.#send(
      {
        type: FFMessageType.LIST_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<FSNode[]>
  }

  /**
   * Delete an empty directory.
   *
   * @category File System
   */
  public deleteDir(path: string, { signal }: FFMessageOptions = {}): Promise<OK> {
    return this.#send(
      {
        type: FFMessageType.DELETE_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>
  }
}