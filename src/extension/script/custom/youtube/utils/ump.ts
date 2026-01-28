import { UMPSliceType } from '@ext/custom/youtube/proto/gvs/common/enum'
import { entries } from '@ext/global/object'
import { Mutex, PromiseWithProgress } from '@ext/lib/async'
import { bufferConcat } from '@ext/lib/buffer'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'

export const enum UMPSliceFlags {
  NONE = 0,
  DIRTY = 0x1,
  DROP = 0x2
}

export type UMPSliceCallback = (data: Uint8Array<ArrayBuffer>, slice: UMPSlice) => PromiseLike<void> | void

const EMPTY_BUFFER = new Uint8Array(0)

const replaceSlice = (stream: CodedStream, begin: number, end: number, slice: UMPSlice): void => {
  const data = slice.toBytes()

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
  newBuffer.set(oldBuffer.subarray(end), begin)

  stream.setBuffer(newBuffer, begin)
}

export class UMPSlice {
  private sliceFlags_: UMPSliceFlags
  private sliceType_: UMPSliceType
  private sliceData_: Uint8Array<ArrayBuffer>

  public constructor(type: UMPSliceType, data: Uint8Array<ArrayBuffer>) {
    this.sliceFlags_ = UMPSliceFlags.NONE
    this.sliceType_ = type
    this.sliceData_ = data
  }

  /*@__MANGLE_PROP__*/public getFlag(mask: UMPSliceFlags): boolean {
    return (this.sliceFlags_ & mask) !== 0
  }

  /*@__MANGLE_PROP__*/public getType(): UMPSliceType {
    return this.sliceType_
  }

  /*@__MANGLE_PROP__*/public getData(): Uint8Array<ArrayBuffer> {
    return this.sliceData_
  }

  /*@__MANGLE_PROP__*/public setFlag(mask: UMPSliceFlags, value = true): void {
    this.sliceFlags_ = (this.sliceFlags_ & ~mask) | (value ? mask : 0)
  }

  /*@__MANGLE_PROP__*/public setType(type: UMPSliceType): void {
    this.sliceFlags_ |= UMPSliceFlags.DIRTY
    this.sliceType_ = type
  }

  /*@__MANGLE_PROP__*/public setData(data: Uint8Array<ArrayBuffer>): void {
    this.sliceFlags_ |= UMPSliceFlags.DIRTY
    this.sliceData_ = data
  }

  /*@__MANGLE_PROP__*/public toBytes(): Uint8Array<ArrayBuffer> {
    const { sliceType_, sliceData_ } = this

    return bufferConcat([varint32Encode(sliceType_)[0], varint32Encode(sliceData_.length)[0], sliceData_])
  }
}

export class UMPContext {
  private readonly manager_: UMPContextManager
  private readonly mutex_: Mutex
  private readonly stream_: CodedStream
  private readonly expire_: number

  public constructor(manager: UMPContextManager, expire: number) {
    this.manager_ = manager
    this.mutex_ = new Mutex()
    this.stream_ = new CodedStream(EMPTY_BUFFER)
    this.expire_ = expire
  }

  /*@__MANGLE_PROP__*/public get isExpired(): boolean {
    return Date.now() >= this.expire_
  }

  public feed(input: ReadableStream<Uint8Array<ArrayBuffer>>): PromiseWithProgress<void, Uint8Array<ArrayBuffer>> {
    return new PromiseWithProgress(async (resolve, reject, progress) => {
      const { mutex_, stream_ } = this

      await mutex_.lock()
      try {
        const reader = input.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) return resolve()

          await this.push(value)
          progress(stream_.getWriteBuffer())
        }
      } catch (error) {
        stream_.setPosition(stream_.getBuffer().length)
        reject(error)
      } finally {
        stream_.setBuffer(stream_.getRemainSize() > 0 ? stream_.getReadBuffer() : EMPTY_BUFFER)
        mutex_.unlock()
      }
    })
  }

  public async push(chunk: Uint8Array<ArrayBuffer>): Promise<void> {
    const { manager_, stream_ } = this

    let position = 0
    try {
      stream_.setBuffer(stream_.getRemainSize() > 0 ? bufferConcat([stream_.getReadBuffer(), chunk]) : chunk)

      while (!stream_.isEnd) {
        position = stream_.getPosition()

        const slice = new UMPSlice(stream_.readVUInt32(), stream_.readRawBytes(stream_.readVUInt32()))
        await manager_.invoke(slice.getType(), slice)

        switch (true) {
          case slice.getFlag(UMPSliceFlags.DROP):
            removeSlice(stream_, position, stream_.getPosition())
            break
          case slice.getFlag(UMPSliceFlags.DIRTY):
            replaceSlice(stream_, position, stream_.getPosition(), slice)
            break
        }
      }
    } catch (error) {
      if (error instanceof RangeError) return stream_.setPosition(position)
      throw error
    }
  }
}

export class UMPContextManager {
  private readonly callbackMap_: Map<number, UMPSliceCallback>
  private readonly contextMap_: Map<string, UMPContext>

  public constructor(callbackMap: Record<number, UMPSliceCallback>) {
    this.callbackMap_ = new Map(entries(callbackMap).map(([k, v]) => [Number(k), v]))
    this.contextMap_ = new Map()
  }

  public grab(params: URLSearchParams): UMPContext {
    const { contextMap_ } = this

    const id = `${params.get('id')}~${params.get('ei')}~${params.get('itag')}`

    let context = contextMap_.get(id)
    if (context == null) {
      context = new UMPContext(this, (Number(params.get('expire')) * 1e3) || (Date.now() + 43200e3))
      contextMap_.set(id, context)
      contextMap_.forEach((v, k) => {
        if (v.isExpired) contextMap_.delete(k)
      })
    }

    return context
  }

  public async invoke(type: UMPSliceType, slice: UMPSlice): Promise<void> {
    const { callbackMap_ } = this

    await (callbackMap_.get(type) ?? callbackMap_.get(UMPSliceType.UNKNOWN))?.(slice.getData(), slice)
  }
}