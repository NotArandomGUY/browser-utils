import { values } from '@ext/global/object'

interface YTWebPoMintParams {
  c: string
  e?: string
  mc?: boolean
  me?: boolean
}

interface YTWebPoSnapshotParams {
  c: string
  cpn: string
  e: string
  encryptedVideoId: string
}

interface YTWebPoClient {
  f(): Promise<void>
  c(maxItems: number): boolean
  m(params: YTWebPoMintParams): Uint8Array<ArrayBuffer>
  mws(params: YTWebPoMintParams): string
}

interface YTWebPoGlobal {
  bevasrs: {
    p: Promise<void>

    c(...args: unknown[]): unknown
    e(...args: unknown[]): unknown
    l(): unknown
    s(params: YTWebPoSnapshotParams): Promise<string>
    wpc(): Promise<YTWebPoClient>
  }
  nqfbel: Function[] | undefined
}

const getYTWebPoClient = async (): Promise<YTWebPoClient | null> => {
  const wpc = await values(window).map((value: unknown) => (value as YTWebPoGlobal)?.bevasrs).find(value => value != null)?.wpc()
  if (wpc == null) return null

  await wpc.f()
  return wpc
}

export const mintYTWebPoToken = async (contentBinding: string): Promise<Uint8Array<ArrayBuffer> | null> => {
  const wpc = await getYTWebPoClient()
  return wpc?.m({ c: contentBinding }) ?? null
}

export const mintYTWebPoTokenString = async (contentBinding: string): Promise<string | null> => {
  const wpc = await getYTWebPoClient()
  return wpc?.mws({ c: contentBinding }) ?? null
}