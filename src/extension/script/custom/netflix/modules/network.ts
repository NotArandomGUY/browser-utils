import { bufferFromString, bufferToString } from '@ext/lib/buffer'
import { decompress } from '@ext/lib/compression'
import { Feature } from '@ext/lib/feature'
import IndexedDB from '@ext/lib/idb'
import { addInterceptNetworkCallback, NetworkContext, NetworkRequestContext, NetworkState } from '@ext/lib/intercept/network'
import Logger from '@ext/lib/logger'

const logger = new Logger('NF-NETWORK')

interface MSLMasterToken {
  tokendata: string
  signature: string
}

type MSLSecureMessageHeader = {
  entityauthdata: object
  headerdata: string
  signature: string
} | {
  mastertoken: MSLMasterToken
  headerdata: string
  signature: string
}
type MSLSecureErrorHeader = {
  entityauthdata: string
  errordata: string
  signature: string
}
type MSLHeader = MSLSecureMessageHeader | MSLSecureErrorHeader

interface MSLPayloadChunk {
  payload: string
  signature: string
}

interface MSLPayload {
  sequencenumber: number
  messageid: number
  endofmsg?: boolean
  compressionalgo?: 'GZIP' | 'LZW'
  data: string
}

interface MSLMessageHeader {
  timestamp?: number
  messageid: number
  errorcode: number
  internalcode?: number
  errormsg?: string
  usermsg?: string
}

interface NamedDataPair<T> {
  name: string
  data: T
}

interface MSLStoreData {
  encryptionKey: CryptoKey
  esn: string
  hmacKey: CryptoKey
  keyxPrivateKey: CryptoKey
  keyxPublicKey: CryptoKey
  masterTokenJSON: MSLMasterToken
  userList: Array<{
    serviceTokenJSONList: Array<MSLMasterToken>
    userId: string
    userIdTokenJSON: MSLMasterToken
  }>
}

interface MSLBody {
  token: MSLMasterToken | null
  header: MSLMessageHeader | null
  payload: object
}

interface MSLRequestContext {
  url: string
  encryptionKey: CryptoKey
  hmacKey: CryptoKey
  request: MSLBody | null
  response: MSLBody | null
}

const MSL_API_REGEXP = /\/msl(_v\d+)?\//

const db = new IndexedDB('netflix.player', [
  { name: 'namedatapairs', params: { keyPath: 'name' } }
])

const decryptCipherEnvelope = async <T>(key: CryptoKey, encodedEnvelope: string): Promise<T> => {
  const envelope = JSON.parse(atob(encodedEnvelope)) as { ciphertext: string, iv: string }
  const iv = bufferFromString(envelope.iv, 'base64')
  const ciphertext = bufferFromString(envelope.ciphertext, 'base64')
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext)

  return JSON.parse(bufferToString(plaintext))
}

const decryptMSLHeader = async (key: CryptoKey, mslHeader: MSLHeader): Promise<{ token: MSLMasterToken | null, header: MSLMessageHeader | null }> => {
  let token: MSLMasterToken | null = null
  let header: MSLMessageHeader | null = null

  if ('mastertoken' in mslHeader) token = JSON.parse(atob(mslHeader.mastertoken.tokendata))
  if ('headerdata' in mslHeader) header = await decryptCipherEnvelope<MSLMessageHeader>(key, mslHeader.headerdata)

  return { token, header }
}

const decryptMSLPayloadChunk = async (key: CryptoKey, mslPayloadChunk: MSLPayloadChunk): Promise<string> => {
  const payload = await decryptCipherEnvelope<MSLPayload>(key, mslPayloadChunk.payload)

  let data = atob(payload.data)
  if (payload.compressionalgo != null) {
    data = bufferToString(await decompress(bufferFromString(data, 'latin1'), payload.compressionalgo.toLowerCase() as Parameters<typeof decompress>[1]))
  }

  return data
}

const decryptMSLBody = async (key: CryptoKey, body: string): Promise<MSLBody> => {
  const [header, ...chunks] = Array.from(body.match(/\{.*?\}(?=\{|$)/sg) ?? []).map(text => JSON.parse(text))

  return {
    ...await decryptMSLHeader(key, header),
    payload: JSON.parse((await Promise.all(chunks.map(decryptMSLPayloadChunk.bind(null, key)))).join(''))
  }
}

const processRequest = async (ctx: NetworkRequestContext<MSLRequestContext>): Promise<void> => {
  const { url, request } = ctx
  const { pathname } = url

  if (!MSL_API_REGEXP.test(pathname)) return

  const pair = await db.transaction('namedatapairs', trans => trans.objectStore('namedatapairs').get<NamedDataPair<MSLStoreData>>('mslstore'))
  if (pair == null) return

  const { encryptionKey, hmacKey } = pair.data

  ctx.userData = {
    url: url.toString(),
    encryptionKey,
    hmacKey,
    request: await decryptMSLBody(encryptionKey, await request.clone().text()),
    response: null
  }
}

const processResponse = async (ctx: NetworkContext<MSLRequestContext, NetworkState.SUCCESS>): Promise<void> => {
  const { userData, response } = ctx

  if (userData == null) return

  const { encryptionKey, hmacKey, ...mslCtx } = userData

  mslCtx.response = await decryptMSLBody(encryptionKey, await response.clone().text())

  logger.debug('msl transaction:', mslCtx)
}

export default class NFNetworkModule extends Feature {
  public constructor() {
    super('network')
  }

  protected activate(): boolean {
    addInterceptNetworkCallback<MSLRequestContext>(async ctx => {
      switch (ctx.state) {
        case NetworkState.UNSENT:
          await processRequest(ctx)
          break
        case NetworkState.SUCCESS:
          await processResponse(ctx)
          break
      }
    })

    return true
  }

  protected deactivate(): boolean {
    return false
  }
}