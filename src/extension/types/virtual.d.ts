declare module '@virtual/bmc-key' {
  export const BMC_KEY: Uint8Array
}

declare module '@virtual/emc-key' {
  export const EMC_KEY: Uint8Array
}

declare module '@virtual/wprt' {
  export const CHUNK_GLOBAL_ID: string
}

declare module '@virtual/script-config' {
  import type { ScriptConfig } from '@ext/script/config'

  export const DEFAULT_SCRIPT_CONFIG: ScriptConfig[]
  export const SITE_SCRIPT_CONFIG: ScriptConfig[]
}