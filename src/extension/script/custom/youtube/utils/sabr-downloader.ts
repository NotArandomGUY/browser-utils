import { YTCommon } from '@ext/custom/youtube/api/schema'
import BufferedRange from '@ext/custom/youtube/proto/gvs/common/buffered-range'
import ClientAbrState from '@ext/custom/youtube/proto/gvs/common/client-abr-state'
import ClientCapabilities from '@ext/custom/youtube/proto/gvs/common/client-capabilities'
import ClientInfo from '@ext/custom/youtube/proto/gvs/common/client-info'
import { SabrContextWritePolicy, UMPSliceType } from '@ext/custom/youtube/proto/gvs/common/enum'
import FormatId from '@ext/custom/youtube/proto/gvs/common/format-id'
import PlaybackAuthorization, { AuthorizedFormat } from '@ext/custom/youtube/proto/gvs/common/playback-authorization'
import PlaybackCookie from '@ext/custom/youtube/proto/gvs/common/playback-cookie'
import SabrContext from '@ext/custom/youtube/proto/gvs/common/sabr-context'
import SabrContextValue from '@ext/custom/youtube/proto/gvs/common/sabr-context-value'
import StreamerContext from '@ext/custom/youtube/proto/gvs/common/streamer-context'
import { VideoPlaybackRequest } from '@ext/custom/youtube/proto/gvs/request'
import UMPMediaHeader from '@ext/custom/youtube/proto/gvs/ump/media-header'
import UMPNextRequestPolicy from '@ext/custom/youtube/proto/gvs/ump/next-request-policy'
import UMPSabrContextUpdate from '@ext/custom/youtube/proto/gvs/ump/sabr-context-update'
import UMPStreamProtectionStatus from '@ext/custom/youtube/proto/gvs/ump/stream-protection-status'
import { UMPContextManager } from '@ext/custom/youtube/utils/ump'
import { floor, max, min } from '@ext/global/math'
import { Mutex, waitTick } from '@ext/lib/async'
import { bufferConcat, bufferFromString, bufferToString } from '@ext/lib/buffer'

const enum PositionType {
  TIME = 't',
  BYTE = 'b'
}

export type SabrFormatInfo = {
  itag: number
  contentLength: string
  lastModified: string
  duration: string
  xtags: string
} & ({
  audioQuality: YTCommon.enums.MediaFormatAudioQuality
} | {
  videoQuality: YTCommon.enums.MediaFormatVideoQuality
})

export interface SabrOptions {
  locale?: string
  clientName?: number
  clientVersion?: string
  playbackRate?: number
  baseUrl: string
  ustreamerConfig: string
  formats: SabrFormatInfo[]
}

const MAX_BUFFER_SIZE_PER_FORMAT = 250 * 1024 * 1024 // 250MB
const DOWNLOADER_LOAD_TIMESTAMP = Date.now()

let requestNumber = 0

class SegmentBuffer {
  public readonly index: number
  public readonly buffer: Uint8Array<ArrayBuffer>

  public readonly t_s: number
  public readonly t_e: number
  public readonly b_s: number
  public readonly b_e: number

  private position_: number

  public constructor(index: number, startMs: number, durationMs: number, startRange: number, contentLength: number) {
    this.index = index
    this.buffer = new Uint8Array(contentLength)

    this.t_s = startMs
    this.t_e = startMs + durationMs
    this.b_s = startRange
    this.b_e = startRange + contentLength

    this.position_ = 0
  }

  public get buffering(): boolean {
    return this.position_ < this.buffer.length
  }

  public append(chunk: Uint8Array<ArrayBuffer>): void {
    const { buffer, position_ } = this

    buffer.set(chunk, position_)
    this.position_ = min(buffer.length, position_ + chunk.length)
  }
}

class FormatBuffer {
  public readonly itag: number
  public readonly lmt: number
  public readonly clen: number
  public readonly xtags: string
  public readonly segments: SegmentBuffer[]

  public constructor({ itag, lastModified, contentLength, xtags }: SabrFormatInfo) {
    this.itag = itag
    this.lmt = Number(lastModified)
    this.clen = Number(contentLength)
    this.xtags = xtags
    this.segments = []
  }

  public getFormatId_(): InstanceType<typeof FormatId> {
    const { itag, lmt, xtags } = this

    return new FormatId({
      itag,
      lmt: BigInt(lmt),
      xtags
    })
  }

  public getBufferedRanges_(): InstanceType<typeof BufferedRange>[] {
    const { segments } = this

    const ranges: InstanceType<typeof BufferedRange>[] = []

    for (const segment of segments) {
      if (segment.index <= 0) continue

      const durationMs = segment.t_e - segment.t_s

      let range = ranges.at(-1)
      if (range != null && (segment.index - range.endSegmentIndex!) === 1) {
        range.durationMs! += BigInt(durationMs)
        range.endSegmentIndex!++
        continue
      }

      range = new BufferedRange({
        formatId: this.getFormatId_(),
        startTimeMs: BigInt(segment.t_s),
        durationMs: BigInt(durationMs),
        startSegmentIndex: segment.index,
        endSegmentIndex: segment.index
      })
      ranges.push(range)
    }

    return ranges
  }

  public getMediaSegment_(header: InstanceType<typeof UMPMediaHeader>): SegmentBuffer {
    const { segments } = this
    const { sequenceNumber, startMs, durationMs, startRange, contentLength } = header

    const index = sequenceNumber ?? 0

    let size = segments.reduce((p, c) => p + c.buffer.length, 0)
    while (segments.length > 0 && size > MAX_BUFFER_SIZE_PER_FORMAT) {
      size -= segments.shift()?.buffer.length ?? 0
    }

    let segment = segments.find(s => s.index === index)
    if (segment == null) {
      segment = new SegmentBuffer(index, Number(startMs ?? 0), Number(durationMs ?? 0), Number(startRange ?? 0), Number(contentLength ?? 0))
      segments.splice(segments.findLastIndex(s => s.index < index) + 1, 0, segment)
    }

    return segment
  }

  public getSegmentBeforeOrAt_(type: PositionType, pos: number): SegmentBuffer | null {
    return this.segments.findLast(s => !s.buffering && s[`${type}_s`] <= pos) ?? null
  }

  public getBufferAt_(type: PositionType, start: number, end: number): Uint8Array<ArrayBuffer> | null {
    const { clen, segments } = this

    const initSegment = segments.find(s => s.b_s === 0)
    if (initSegment != null) end = max(end, initSegment[`${type}_s`])

    const lastSegment = segments.find(s => s.b_e === clen)
    if (lastSegment != null) start = min(start, lastSegment[`${type}_e`])

    const rangeSegments = segments.filter(s => !(s[`${type}_s`] > end || s[`${type}_e`] < start))
    const buffering = rangeSegments.length === 0 || rangeSegments.some((s, i) => s.buffering || (i > 0 && (s.index - rangeSegments[i - 1].index) !== 1))
    if (buffering) return null

    const first = rangeSegments.at(0)!
    const last = rangeSegments.at(-1)!
    if ((first.b_s > 0 && start < first[`${type}_s`]) || (last.b_e < clen && last[`${type}_e`] < end)) return null

    let buffer = bufferConcat(rangeSegments.map(s => s.buffer))
    if (type === PositionType.BYTE) {
      const offset = start - rangeSegments[0].b_s
      buffer = buffer.subarray(offset, offset + (end - start))
    }

    return buffer
  }
}

class AudioFormatBuffer extends FormatBuffer {
  public readonly quality: YTCommon.enums.MediaFormatAudioQuality

  public constructor(info: Extract<SabrFormatInfo, { audioQuality: YTCommon.enums.MediaFormatAudioQuality }>) {
    super(info)

    this.quality = info.audioQuality
  }
}

class VideoFormatBuffer extends FormatBuffer {
  public readonly quality: YTCommon.enums.MediaFormatVideoQuality

  public constructor(info: Extract<SabrFormatInfo, { videoQuality: YTCommon.enums.MediaFormatVideoQuality }>) {
    super(info)

    this.quality = info.videoQuality
  }
}

export default class SabrDownloader {
  /// Public ///

  public constructor({
    locale,
    clientName,
    clientVersion,
    playbackRate,
    baseUrl,
    ustreamerConfig,
    formats
  }: SabrOptions) {
    this.clientInfo_ = new ClientInfo({
      hl: locale,
      clientName,
      clientVersion
    })
    this.ustreamerConfig_ = bufferFromString(ustreamerConfig, 'base64url')
    this.playbackRate_ = playbackRate ?? 1
    this.baseUrl_ = baseUrl

    const { audioFormats_, videoFormats_, headerMap_, contextMap_ } = this

    let duration = 0
    for (const format of formats) {
      if ('audioQuality' in format) audioFormats_.push(new AudioFormatBuffer(format))
      if ('videoQuality' in format) videoFormats_.push(new VideoFormatBuffer(format))

      const formatDuration = Number(format.duration)
      if (formatDuration > duration) duration = formatDuration
    }
    this.durationMs_ = duration

    this.manager_ = new UMPContextManager({
      [UMPSliceType.MEDIA_HEADER]: (data) => {
        const header = new UMPMediaHeader().deserialize(data)
        if (header.headerId == null) return

        const format = this.getMediaFormat_(header)
        if (format == null) return

        headerMap_.set(header.headerId, header)
      },
      [UMPSliceType.MEDIA]: (data) => {
        const header = headerMap_.get(data[0])
        if (header == null) return

        const format = this.getMediaFormat_(header)
        if (format == null) return

        format.getMediaSegment_(header).append(data.subarray(1))
      },
      [UMPSliceType.MEDIA_END]: (data) => {
        const header = headerMap_.get(data[0])
        if (header == null) return

        const format = this.getMediaFormat_(header)
        if (format == null) return

        const segment = format.getMediaSegment_(header)
        if (segment.buffering) format.segments.splice(format.segments.indexOf(segment), 1)
      },
      [UMPSliceType.NEXT_REQUEST_POLICY]: (data) => {
        const { targetAudioReadaheadMs, targetVideoReadaheadMs, backoffTimeMs, playbackCookie } = new UMPNextRequestPolicy().deserialize(data)

        this.playbackCookie_ = playbackCookie
        this.backoffUntil_ = Date.now() + (backoffTimeMs ?? 0)
        this.readaheadMs_ = max(targetAudioReadaheadMs ?? 0, targetVideoReadaheadMs ?? 0)
      },
      [UMPSliceType.SABR_REDIRECT]: (data) => {
        this.baseUrl_ = bufferToString(data, 'utf8')
      },
      [UMPSliceType.SABR_CONTEXT_UPDATE]: (data) => {
        const { type, value, sendByDefault, writePolicy } = new UMPSabrContextUpdate().deserialize(data)

        if (type == null || writePolicy === SabrContextWritePolicy.SABR_CONTEXT_WRITE_POLICY_KEEP_EXISTING && contextMap_.has(type)) return

        contextMap_.set(type, sendByDefault ? value : null)
      },
      [UMPSliceType.STREAM_PROTECTION_STATUS]: (data) => {
        const message = new UMPStreamProtectionStatus().deserialize(data)
        if (message.status === 3) this.pause()
      }
    })
  }

  public get paused(): boolean {
    return this.timer_ == null
  }

  public get buffering(): boolean {
    return this.playbackBase_ < 0
  }

  public get ended(): boolean {
    return !isFinite(this.playbackTime_)
  }

  public get currentTime(): number {
    return this.getPlayerTimeMs_() / 1e3
  }

  /*@__MANGLE_PROP__*/public async fetchChunk(itag: number, start?: number, end?: number): Promise<[formatId: InstanceType<typeof FormatId>, buffer: Uint8Array<ArrayBuffer>]> {
    const { audioFormats_, videoFormats_, selectedFormats_ } = this

    const format = audioFormats_.find(f => f.itag === itag) ?? videoFormats_.find(f => f.itag === itag)
    if (format == null) throw new Error('format not available')

    if (!selectedFormats_.includes(format)) {
      const index = selectedFormats_.findIndex(f => f.constructor === format.constructor)
      if (index < 0) {
        selectedFormats_.push(format)
      } else {
        selectedFormats_.splice(index, 1, format)
      }
    }

    start ??= 0
    end ??= format.clen

    let buffer: Uint8Array<ArrayBuffer> | null = null
    while (buffer == null) {
      await waitTick()

      buffer = format.getBufferAt_(PositionType.BYTE, start, end)
      if (buffer != null || !this.paused) continue

      this.seek(format.getSegmentBeforeOrAt_(PositionType.BYTE, start)?.t_e ?? 0, false)
      this.play()
    }

    return [format.getFormatId_(), buffer]
  }

  /*@__MANGLE_PROP__*/public setPoToken(poToken: Uint8Array<ArrayBuffer>): void {
    this.poToken_ = poToken
  }

  public play(): void {
    if (!this.paused) return

    this.timer_ = setInterval(this.update_.bind(this), 100)
  }

  public pause(): void {
    if (this.paused) return

    clearInterval(this.timer_!)
    this.timer_ = null

    this.setPlaybackState_(true)
  }

  public seek(time: number, relative: boolean): void {
    const { durationMs_, playbackTime_ } = this

    this.playbackTime_ = max(0, min(durationMs_, relative ? (min(durationMs_, playbackTime_) + time) : time))
    this.playbackBase_ = -1
  }

  /// Private ///

  private readonly mutex_ = new Mutex()
  private readonly manager_: UMPContextManager
  private readonly audioFormats_: AudioFormatBuffer[] = []
  private readonly videoFormats_: VideoFormatBuffer[] = []
  private readonly selectedFormats_: FormatBuffer[] = []
  private readonly headerMap_ = new Map<number, InstanceType<typeof UMPMediaHeader>>()
  private readonly contextMap_ = new Map<number, InstanceType<typeof SabrContextValue> | null>()
  private readonly clientInfo_: InstanceType<typeof ClientInfo>
  private readonly ustreamerConfig_: Uint8Array<ArrayBuffer>
  private readonly durationMs_: number
  private readonly playbackRate_: number
  private playbackBase_ = -1
  private playbackTime_ = 0
  private playbackCookie_: InstanceType<typeof PlaybackCookie> | null = null
  private backoffUntil_ = 0
  private readaheadMs_ = 0
  private baseUrl_: string
  private poToken_: Uint8Array<ArrayBuffer> | null = null
  private timer_: ReturnType<typeof setInterval> | null = null

  private getPlayerTimeMs_(): number {
    const { durationMs_, playbackRate_, playbackBase_, playbackTime_ } = this

    return floor(max(0, min(durationMs_, playbackTime_ + (playbackBase_ < 0 ? 0 : ((performance.now() - playbackBase_) * playbackRate_)))))
  }

  private getMediaFormat_(header: InstanceType<typeof UMPMediaHeader>): FormatBuffer | null {
    const { audioFormats_, videoFormats_ } = this
    const { itag, lmt, xtags } = header

    return (
      audioFormats_.find(f => f.itag === itag && f.lmt === Number(lmt) && (xtags == null || f.xtags === xtags)) ??
      videoFormats_.find(f => f.itag === itag && f.lmt === Number(lmt) && (xtags == null || f.xtags === xtags)) ??
      null
    )
  }

  private setPlaybackState_(paused: boolean): void {
    this.playbackTime_ = this.getPlayerTimeMs_()
    this.playbackBase_ = paused ? -1 : performance.now()
  }

  private async fetchSegments_(): Promise<void> {
    const { manager_, audioFormats_, videoFormats_, selectedFormats_, contextMap_, clientInfo_, playbackCookie_, ustreamerConfig_, baseUrl_, poToken_, playbackRate_ } = this

    const elapsedSinceLoad = BigInt(Date.now() - DOWNLOADER_LOAD_TIMESTAMP)
    const resolution = selectedFormats_.find(format => format instanceof VideoFormatBuffer)?.quality ?? YTCommon.enums.MediaFormatVideoQuality.highres
    const contexts = Array.from(contextMap_.entries())

    const url = new URL(baseUrl_)
    const { searchParams } = url

    searchParams.set('rn', `${requestNumber++}`)
    searchParams.set('alr', 'yes')

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      body: new VideoPlaybackRequest({
        clientAbrState: new ClientAbrState({
          timeSinceLastManualFormatSelectionMs: elapsedSinceLoad,
          lastManualDirection: 0,
          lastManualSelectedResolution: resolution,
          clientViewportWidth: 8192,
          clientViewportHeight: 4608,
          stickyResolution: resolution,
          playerTimeMs: BigInt(this.getPlayerTimeMs_()),
          visibility: 0,
          playbackRate: playbackRate_,
          elapsedWallTimeMs: elapsedSinceLoad,
          av1QualityThreshold: 8192,
          isSmooth: true,
          clientCapabilities: new ClientCapabilities({
            defaultPolicy: 0,
            smooth: 8192,
            visibility: 0,
            autonav: 0,
            performance: 8192,
            speed: 0
          }),
          playbackAuthorization: new PlaybackAuthorization({
            authorizedFormats: [
              new AuthorizedFormat({ trackType: 1, isHdr: false }),
              new AuthorizedFormat({ trackType: 2, isHdr: false }),
              new AuthorizedFormat({ trackType: 2, isHdr: true })
            ]
          })
        }),
        selectedFormatIds: selectedFormats_.filter(f => f.segments.length > 0).map(f => f.getFormatId_()),
        bufferedRanges: selectedFormats_.flatMap(f => f.getBufferedRanges_()),
        preferredAudioFormatIds: audioFormats_.filter(f => selectedFormats_.includes(f)).map(f => f.getFormatId_()),
        preferredVideoFormatIds: videoFormats_.filter(f => selectedFormats_.includes(f)).map(f => f.getFormatId_()),
        streamerContext: new StreamerContext({
          clientInfo: clientInfo_,
          playbackCookie: playbackCookie_,
          poToken: poToken_,
          sabrContexts: contexts.map(([type, value]) => value && new SabrContext({ type, value: value.serialize() })).filter(ctx => ctx != null),
          unsentSabrContexts: contexts.map(([type, value]) => value && type).filter(type => type != null)
        }),
        videoPlaybackUstreamerConfig: ustreamerConfig_
      }).serialize()
    })

    const { ok, status, body } = response
    if (status === 403) this.pause()
    if (!ok || body == null) return

    await manager_.grab(searchParams).feed(body)
  }

  private async update_(): Promise<void> {
    const { mutex_, selectedFormats_, durationMs_, backoffUntil_, readaheadMs_ } = this

    if (mutex_.isLocked) return

    await mutex_.lock()
    try {
      const bufferStartMs = this.getPlayerTimeMs_()
      const bufferEndMs = bufferStartMs + readaheadMs_

      const buffering = selectedFormats_.some(f => f.getBufferAt_(PositionType.TIME, bufferStartMs, bufferEndMs) == null)
      this.setPlaybackState_(buffering)

      if (buffering) {
        if (backoffUntil_ < Date.now()) await this.fetchSegments_()
        return
      }

      const ended = !selectedFormats_.some(f => f.getBufferAt_(PositionType.BYTE, f.clen, f.clen) == null)
      if (!ended || this.getPlayerTimeMs_() < durationMs_) return

      this.pause()
      this.seek(Infinity, false)
    } finally {
      mutex_.unlock()
    }
  }
}