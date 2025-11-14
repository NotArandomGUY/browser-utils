import { UMPType } from '@ext/custom/youtube/proto/ump'
import { min } from '@ext/global/math'
import { assign, entries } from '@ext/global/object'
import { bufferConcat } from '@ext/lib/buffer'
import CodedStream from '@ext/lib/protobuf/coded-stream'
import { varint32Encode } from '@ext/lib/protobuf/varint'

export const enum UMPSliceFlags {
  NONE = 0,
  DIRTY = 0x1,
  DEFER_OR_DROP = 0x2
}

export type UMPSliceCallback = (data: Uint8Array<ArrayBuffer>, slice: UMPSlice) => PromiseLike<void> | void

const replaceSlice = (stream: CodedStream, position: number, size: number, slice: UMPSlice): void => {
  const data = bufferConcat([varint32Encode(slice.getType())[0], varint32Encode(slice.getSize())[0], slice.getData()])

  const sizeDelta = data.length - size
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length + sizeDelta)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(data, position)
  newBuffer.set(oldBuffer.subarray(position + size), position + data.length)

  stream.setBuffer(newBuffer, position + data.length)
}

const removeSlice = (stream: CodedStream, position: number, size: number): void => {
  const oldBuffer = stream.getBuffer()
  const newBuffer = new Uint8Array(oldBuffer.length - size)

  newBuffer.set(oldBuffer.subarray(0, position), 0)
  newBuffer.set(oldBuffer.subarray(position + size), position)

  stream.setBuffer(newBuffer, position)
}

export class UMPSlice {
  private flags: UMPSliceFlags
  private type: UMPType
  private size: number
  private data: Uint8Array<ArrayBuffer>

  public constructor(type: UMPType, size: number) {
    this.flags = UMPSliceFlags.NONE
    this.type = type
    this.size = 0
    this.data = new Uint8Array(size)
  }

  public get isFulfilled(): boolean {
    return this.size >= this.data.length
  }

  public getFlag(mask: UMPSliceFlags): boolean {
    return (this.flags & mask) !== 0
  }

  public getType(): UMPType {
    return this.type
  }

  public getSize(): number {
    return this.size
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
    this.size = data.length
    this.data = data
  }

  public push(chunk: Uint8Array): boolean {
    this.data.set(chunk, this.size)
    this.size += chunk.length

    return this.isFulfilled
  }
}

export class UMPContext {
  private readonly sliceMap: Map<UMPType, UMPSlice>
  private readonly stream: CodedStream
  private readonly callbacks: Map<number, UMPSliceCallback>

  public constructor(callbacks: Record<number, UMPSliceCallback>) {
    this.sliceMap = new Map()
    this.stream = new CodedStream()
    this.callbacks = new Map(entries(callbacks).map(([k, v]) => [Number(k), v]))
  }

  public getBuffer(): Uint8Array<ArrayBuffer> {
    return this.stream.getBuffer()
  }

  public async feed(buffer: Uint8Array<ArrayBuffer>, readonly: boolean): Promise<(Error & { slice: UMPSlice | null }) | void> {
    const { sliceMap, stream, callbacks } = this

    let slice: UMPSlice | null = null
    try {
      stream.setBuffer(buffer)

      while (!stream.isEnd) {
        const slicePosition = stream.getPosition()
        const sliceType = stream.readVUInt32()
        const sliceDataSize = stream.readVUInt32()
        const sliceHeadSize = stream.getPosition() - slicePosition

        const sliceData = stream.readRawBytes(min(stream.getRemainSize(), sliceDataSize))
        const sliceSize = sliceHeadSize + sliceData.length

        slice = sliceMap.get(sliceType) ?? new UMPSlice(sliceType, sliceDataSize)
        if (slice.push(sliceData)) {
          sliceMap.delete(sliceType)
          await (callbacks.get(slice.getType()) ?? callbacks.get(UMPType.UNKNOWN))?.(slice.getData(), slice)
        } else {
          sliceMap.set(sliceType, slice)
          slice.setFlag(UMPSliceFlags.DEFER_OR_DROP)
        }

        if (readonly) continue

        switch (true) {
          case slice.getFlag(UMPSliceFlags.DEFER_OR_DROP):
            removeSlice(stream, slicePosition, sliceSize)
            slice.setFlag(UMPSliceFlags.DEFER_OR_DROP, false)
            break
          case slice.getFlag(UMPSliceFlags.DIRTY):
            replaceSlice(stream, slicePosition, sliceSize, slice)
            break
        }
      }
    } catch (error) {
      if (!(error instanceof Error) || error instanceof RangeError) return

      return assign(error, { slice })
    }
  }
}