export type FFFSPath = string

/**
 * ffmpeg-core loading configuration.
 */
export interface FFMessageLoadConfig {
  /**
   * `ffmpeg-core.js` URL.
   *
   * @defaultValue `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
   */
  coreURL?: string
  /**
   * `ffmpeg-core.wasm` URL.
   *
   * @defaultValue `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;
   */
  wasmURL?: string
  /**
   * `ffmpeg-core.worker.js` URL. This worker is spawned when using multithread version of ffmpeg-core.
   *
   * @ref: https://ffmpegwasm.netlify.app/docs/overview#architecture
   * @defaultValue `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${CORE_VERSION}/dist/umd/ffmpeg-core.worker.js`;
   */
  workerURL?: string
}

export interface FFMessageOptions {
  signal?: AbortSignal
}

export interface FFMessageExecData {
  args: string[]
  timeout?: number
}

export interface FFMessageWriteFileData {
  path: FFFSPath
  data: FileData
}

export interface FFMessageReadFileData {
  path: FFFSPath
  encoding: string
}

export interface FFMessageDeleteFileData {
  path: FFFSPath
}

export interface FFMessageRenameData {
  oldPath: FFFSPath
  newPath: FFFSPath
}

export interface FFMessageCreateDirData {
  path: FFFSPath
}

export interface FFMessageListDirData {
  path: FFFSPath
}

/**
 * @remarks
 * Only deletes empty directory.
 */
export interface FFMessageDeleteDirData {
  path: FFFSPath
}

export const enum FFFSType {
  MEMFS = 'MEMFS',
  NODEFS = 'NODEFS',
  NODERAWFS = 'NODERAWFS',
  IDBFS = 'IDBFS',
  WORKERFS = 'WORKERFS',
  PROXYFS = 'PROXYFS'
}

export type WorkerFSFileEntry =
  | File

export interface WorkerFSBlobEntry {
  name: string
  data: Blob
}

export interface WorkerFSMountData {
  blobs?: WorkerFSBlobEntry[]
  files?: WorkerFSFileEntry[]
}

export type FFFSMountOptions =
  | WorkerFSMountData

export interface FFMessageMountData {
  fsType: FFFSType
  options: FFFSMountOptions
  mountPoint: FFFSPath
}

export interface FFMessageUnmountData {
  mountPoint: FFFSPath
}

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageExecData
  | FFMessageWriteFileData
  | FFMessageReadFileData
  | FFMessageDeleteFileData
  | FFMessageRenameData
  | FFMessageCreateDirData
  | FFMessageListDirData
  | FFMessageDeleteDirData
  | FFMessageMountData
  | FFMessageUnmountData

export interface FFMessageBase {
  type: string
  data?: FFMessageData
}

export interface FFMessage extends FFMessageBase {
  id: number
}

export interface FFMessageEvent extends MessageEvent {
  data: FFMessage
}

export interface FFLogEvent {
  type: string
  message: string
}

export interface FFProgressEvent {
  progress: number
  time: number
}

export type ExitCode = number
export type ErrorMessage = string
export type FileData = Uint8Array | string
export type IsFirst = boolean
export type OK = boolean

export interface FSNode {
  name: string
  isDir: boolean
}

export type FFCallbackData =
  | FileData
  | ExitCode
  | ErrorMessage
  | FFLogEvent
  | FFProgressEvent
  | IsFirst
  | OK // eslint-disable-line
  | Error
  | FSNode[]
  | undefined

export interface FFCallbacks {
  [id: number | string]: (data: FFCallbackData) => void
}

export type FFLogEventCallback = (event: FFLogEvent) => void
export type FFProgressEventCallback = (event: FFProgressEvent) => void

export interface FFMessageEventCallback {
  data: {
    id: number
    type: string
    data: FFCallbackData
  }
}

export const enum FFMessageType {
  LOAD = 'LOAD',
  EXEC = 'EXEC',
  FFPROBE = 'FFPROBE',
  WRITE_FILE = 'WRITE_FILE',
  READ_FILE = 'READ_FILE',
  DELETE_FILE = 'DELETE_FILE',
  RENAME = 'RENAME',
  CREATE_DIR = 'CREATE_DIR',
  LIST_DIR = 'LIST_DIR',
  DELETE_DIR = 'DELETE_DIR',
  ERROR = 'ERROR',
  DOWNLOAD = 'DOWNLOAD',
  PROGRESS = 'PROGRESS',
  LOG = 'LOG',
  MOUNT = 'MOUNT',
  UNMOUNT = 'UNMOUNT'
}