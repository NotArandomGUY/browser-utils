export default class SyncTime {
  private sysNowMs: () => number // Get system current time
  private offsetMs: number | null // Offset in ms

  public constructor() {
    this.sysNowMs = Date.now
    this.offsetMs = null
  }

  public isSynced(): boolean {
    return this.offsetMs != null
  }

  public localNow(): number {
    return this.sysNowMs()
  }

  public now(): number {
    const { sysNowMs, offsetMs } = this
    if (offsetMs == null) throw new Error('use of now() before sync')

    return sysNowMs() + offsetMs
  }

  public sync(remoteMs: number, latencyMs = 0): void {
    this.offsetMs = remoteMs - (this.localNow() - latencyMs)
  }

  public desync(): void {
    this.offsetMs = null
  }
}