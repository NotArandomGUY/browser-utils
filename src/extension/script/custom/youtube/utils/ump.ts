import { UMPType } from '@ext/custom/youtube/proto/ump'
import { entries } from '@ext/global/object'
import { bufferConcat } from '@ext/lib/buffer'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'

export const enum UMPSliceFlags {
  NONE = 0,
  DIRTY = 0x1,
  DROP = 0x2
}

export type UMPSliceCallback = (data: Uint8Array<ArrayBuffer>, slice: UMPSlice) => PromiseLike<void> | void

const replaceSlice = (stream: CodedStream, begin: number, end: number, slice: UMPSlice): void => {
  const data = bufferConcat([varint32Encode(slice.getType())[0], varint32Encode(slice.getSize())[0], slice.getData()])

  const sizeDelta = data.length - (end - begin)
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length + sizeDelta)

  newBuffer.set(oldBuffer.subarray(0, begin), 0)
  newBuffer.set(data, begin)
  newBuffer.set(oldBuffer.subarray(end), begin + data.length)

  stream.setBuffer(newBuffer, begin + data.length)
}

const removeSlice = (stream: CodedStream, begin: number, end: number): void => {
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length - (end - begin))

  newBuffer.set(oldBuffer.subarray(0, begin), 0)
  newBuffer.set(oldBuffer.subarray(begin + end), begin)

  stream.setBuffer(newBuffer, begin)
}

export class UMPSlice {
  private flags: UMPSliceFlags
  private type: UMPType
  private data: Uint8Array<ArrayBuffer>

  public constructor(type: UMPType, data: Uint8Array<ArrayBuffer>) {
    this.flags = UMPSliceFlags.NONE
    this.type = type
    this.data = data
  }

  public getFlag(mask: UMPSliceFlags): boolean {
    return (this.flags & mask) !== 0
  }

  public getType(): UMPType {
    return this.type
  }

  public getSize(): number {
    return this.data.length
  }

  public getData(): Uint8Array<ArrayBuffer> {
    return this.data
  }

  public setFlag(mask: UMPSliceFlags, value = true): void {
    this.flags = (this.flags & ~mask) | (value ? mask : 0)
  }

  public setType(type: UMPType): void {
    this.flags |= UMPSliceFlags.DIRTY
    this.type = type
  }

  public setData(data: Uint8Array<ArrayBuffer>): void {
    this.flags |= UMPSliceFlags.DIRTY
    this.data = data
  }
}

export class UMPContext {
  private readonly manager: UMPContextManager
  private readonly stream: CodedStream
  private readonly expireAt: number

  public constructor(manager: UMPContextManager, expireAt: number) {
    this.manager = manager
    this.stream = new CodedStream()
    this.expireAt = expireAt
  }

  public get isExpired(): boolean {
    return Date.now() >= this.expireAt
  }

  public async feed(input: ReadableStream<Uint8Array<ArrayBuffer>>, output?: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
    const { stream } = this

    const reader = input.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) return output?.close()

        await this.push(value)
        output?.enqueue(stream.getWriteBuffer())
      }
    } catch (error) {
      stream.setPosition(stream.getBuffer().length)
      throw error
    } finally {
      stream.setBuffer(stream.getReadBuffer())
      reader.releaseLock()
    }
  }

  public async push(chunk: Uint8Array<ArrayBuffer>): Promise<void> {
    const { manager, stream } = this

    let position = 0
    try {
      stream.setBuffer(stream.getRemainSize() > 0 ? bufferConcat([stream.getReadBuffer(), chunk]) : chunk)

      while (!stream.isEnd) {
        position = stream.getPosition()

        const slice = new UMPSlice(stream.readVUInt32(), stream.readRawBytes(stream.readVUInt32()))
        await manager.invoke(slice.getType(), slice)

        switch (true) {
          case slice.getFlag(UMPSliceFlags.DROP):
            removeSlice(stream, position, stream.getPosition())
            break
          case slice.getFlag(UMPSliceFlags.DIRTY):
            replaceSlice(stream, position, stream.getPosition(), slice)
            break
        }
      }
    } catch (error) {
      if (error instanceof RangeError) return stream.setPosition(position)
      throw error
    }
  }
}

export class UMPContextManager {
  private readonly callbackMap: Map<number, UMPSliceCallback>
  private readonly contextMap: Map<string, UMPContext>

  public constructor(callbackMap: Record<number, UMPSliceCallback>) {
    this.callbackMap = new Map(entries(callbackMap).map(([k, v]) => [Number(k), v]))
    this.contextMap = new Map()
  }

  public grab(params: URLSearchParams): UMPContext {
    const { contextMap } = this

    const expireAt = (Number(params.get('expire')) * 1e3) || (Date.now() + 60e3)
    const id = `${params.get('id')}~${params.get('itag')}~${expireAt}`

    let context = contextMap.get(id)
    if (context != null) return context

    context = new UMPContext(this, expireAt)
    contextMap.set(id, context)
    contextMap.forEach((v, k) => {
      if (v.isExpired) contextMap.delete(k)
    })

    return context
  }

  public async invoke(type: UMPType, slice: UMPSlice): Promise<void> {
    const { callbackMap } = this

    await (callbackMap.get(type) ?? callbackMap.get(UMPType.UNKNOWN))?.(slice.getData(), slice)
  }
}