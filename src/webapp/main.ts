import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import { BURemoteCmd } from '@sh/bu-remote/cmd'
import { PEER_CONFIG } from '@sh/bu-remote/config'
import { BURemoteAbsoluteSeekData, BURemoteData, BURemoteExportReqData, BURemoteImportReqData, BURemotePauseData, BURemotePlayData, BURemoteRelativeSeekData, BURemoteRelativeVolumeData, BURemoteStreamIdData, BURemoteSyncTimeReqData } from '@sh/bu-remote/data'
import dialog from '@sh/dialog'
import SyncTime from '@sh/sync-time'
import Peer, { DataConnection, MediaConnection } from 'peerjs'
import QrScanner from 'qr-scanner'

(() => {
  const qrVideo = document.querySelector<HTMLVideoElement>('#qrVideo') ?? new HTMLVideoElement()
  const streamVideo = document.querySelector<HTMLVideoElement>('#streamVideo') ?? new HTMLVideoElement()
  const streamTextTrack = streamVideo.addTextTrack('subtitles', 'Stream', 'en')
  const peerConnectForm = $<HTMLFormElement>('#peerConnectForm')
  const peerControlForm = $<HTMLFormElement>('#peerControlForm')

  if (peerConnectForm == null || peerControlForm == null) throw new Error('Missing element(s)')

  const syncTime = new SyncTime()

  let dataConn: DataConnection | null = null
  let streamConn: MediaConnection | null = null
  let reconnectPeerId: string | null = null
  let reconnectAttempt = 0
  let isPaused = false
  let isSeeking = false
  let isWaitingInteract = false

  let currSubtitle = ''
  let currTextTrackCue: TextTrackCue | null = null
  let lastTextTrackUpdate = 0

  function timeToHMS(time: number): string {
    return new Date(time * 1e3).toISOString().slice(11, 19)
  }

  function onDataConnection(conn: DataConnection, peerId: string): void {
    if (reconnectAttempt > 3) return

    isPaused = false
    isSeeking = false

    conn.on('open', () => {
      if (dataConn != null) dataConn.close()
      dataConn = conn
      reconnectAttempt = 0

      peerConnectForm.find<HTMLInputElement>('[name="id"]').val(peerId)

      conn.send(<BURemoteSyncTimeReqData>{
        cmd: BURemoteCmd.CMD_SYNC_TIME_REQ,
        time: syncTime.localNow()
      })
    })
    conn.on('close', () => {
      if (dataConn !== conn) return

      peerConnectForm.find<HTMLInputElement>('[name="id"]').val('')

      dataConn = null
      streamConn?.close()

      syncTime.desync()

      if (reconnectPeerId !== peerId) return

      reconnectAttempt++
      onDataConnection(peer.connect(peerId), peerId)
    })
    conn.on('data', <(data: unknown) => void>((data: BURemoteData) => {
      if (typeof data !== 'object' || data == null) {
        conn.close()
        return
      }

      switch (data.cmd) { // NOSONAR
        case BURemoteCmd.CMD_SYNC_TIME_RSP:
          syncTime.sync(data.time, (data.sent - syncTime.localNow()) / 2)

          if (streamConn != null) break

          conn.send(<BURemoteStreamIdData>{
            cmd: BURemoteCmd.CMD_STREAM_ID,
            time: syncTime.now(),
            id: peer.id,
            reconnect: reconnectAttempt > 0
          })
          break
        case BURemoteCmd.CMD_IMPORT_RSP:
          if (data.err) {
            dialog('Import Error', data.err, ['OK'], false)
            break
          }

          sessionStorage.removeItem('viu-ls-user-data')
          dialog('Success', 'Import success', ['OK'], false)
          break
        case BURemoteCmd.CMD_EXPORT_RSP:
          if (data.data == null) {
            dialog('Export Error', data.err ?? 'Unknown error', ['OK'], false)
            break
          }

          sessionStorage.setItem('viu-ls-user-data', data.data)
          dialog('Success', 'Export success', ['OK'], false)
          break
        case BURemoteCmd.CMD_PLAYER_INFO:
          isPaused = data.p ?? true
          currSubtitle = data.s ?? ''

          if (!isSeeking) {
            peerControlForm.find('[name="time"]').prop('max', data.d).val(data.c)
            peerControlForm.find('label[for="time"]').text(`${timeToHMS(data.c)} / ${timeToHMS(data.d)}`)
          }

          conn.send(<BURemoteSyncTimeReqData>{
            cmd: BURemoteCmd.CMD_SYNC_TIME_REQ,
            time: syncTime.localNow()
          })
          break
        default:
          console.warn('invalid data:', data)
          conn.close()
          break
      }
    }))
  }

  let peer: Peer
  function createPeer(): void {
    peer = new Peer(PEER_CONFIG)

    peer.on('disconnected', () => {
      peer.destroy()
      createPeer()
    })
    peer.on('call', conn => {
      if (dataConn == null) {
        conn.close()
        return
      }

      conn.on('stream', stream => {
        streamConn = conn
        streamVideo.srcObject = stream
        streamVideo.volume = 1
        streamVideo.muted = false
        streamVideo.play()

        isWaitingInteract = streamVideo.paused
      })
      conn.on('close', () => {
        if (streamConn !== conn) return

        streamConn = null
        streamVideo.pause()
      })
      conn.answer()
    })
  }
  createPeer()

  async function scanPeerIdQR(abort?: AbortController): Promise<string> {
    if (!await QrScanner.hasCamera()) throw new Error('No camera available')

    return new Promise<string>((resolve, reject) => {
      let abortLoop: number | null = null

      const scanner = new QrScanner(qrVideo, result => {
        scanner.stop()

        qrVideo.style.display = 'none'
        streamVideo.style.display = 'block'

        document.querySelectorAll('.scan-region-highlight').forEach(elem => {
          elem.parentElement?.removeChild(elem)
        })

        if (abortLoop != null) window.clearInterval(abortLoop)

        const params = new URLSearchParams(atob(result.data))

        const prodCat = params.get('pc')
        const prodName = params.get('pn')
        const peerId = params.get('peer-id')

        if (prodCat !== 'client' || prodName !== 'bu-remote' || peerId == null) {
          if (abortLoop != null) window.clearInterval(abortLoop)
          reject(new Error(`Invalid QR Code (c:${prodCat},n:${prodName})`))
          return
        }

        resolve(peerId)
      }, {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: false
      })

      if (abort != null) {
        abortLoop = window.setInterval(() => {
          if (!abort.signal.aborted) return

          scanner.stop()

          if (abortLoop != null) window.clearInterval(abortLoop)
          reject(new Error('Operation aborted'))
        }, 1e3)
      }

      qrVideo.style.display = 'block'
      streamVideo.style.display = 'none'

      scanner.start()
    })
  }

  streamVideo.addEventListener('playing', () => {
    if (!isPaused) return

    dataConn?.send(<BURemotePlayData>{
      cmd: BURemoteCmd.CMD_PLAY,
      time: syncTime.now()
    })
  })

  streamVideo.addEventListener('pause', () => {
    if (isPaused) return

    dataConn?.send(<BURemotePauseData>{
      cmd: BURemoteCmd.CMD_PAUSE,
      time: syncTime.now()
    })
  })

  streamVideo.addEventListener('click', () => {
    if (streamConn == null || !isWaitingInteract) return

    isWaitingInteract = false

    // failed to autoplay stream, retry now since we have interaction
    if (streamVideo.paused) streamConn.close()
  })

  streamVideo.addEventListener('dblclick', evt => {
    evt.preventDefault()

    dialog('Video Mode', 'Select Video Mode', ['Default', 'Inline'], true).then(action => {
      switch (action) {
        case 'Default':
          streamVideo.playsInline = false
          break
        case 'Inline':
          streamVideo.playsInline = true
          break
        default:
          console.log('cancel view mode change')
          break
      }
    })
  })

  peerConnectForm.on('submit', evt => {
    evt.preventDefault()

    reconnectPeerId = null
    reconnectAttempt = 0

    if (dataConn != null) dataConn.close()

    scanPeerIdQR().then(peerId => {
      onDataConnection(peer.connect(peerId), peerId)
    }).catch(err => {
      dialog('Error', (<Error>err).message, ['OK'], false)
    })
  })

  peerControlForm.on('submit', evt => {
    evt.preventDefault()

    const { submitter } = <SubmitEvent>evt.originalEvent
    if (submitter == null) return

    if (dataConn == null) {
      dialog('Error', 'Not connected to any peer', ['OK'], false)
      return
    }

    if (!syncTime.isSynced()) {
      dialog('Please wait...', 'Initializing connection...', ['OK'], false)
      return
    }

    const name = submitter.getAttribute('name') ?? ''
    const value = submitter.getAttribute('value') ?? ''

    switch (name) {
      case 'play':
        dataConn.send(<BURemotePlayData | BURemotePauseData>{
          cmd: isPaused ? BURemoteCmd.CMD_PLAY : BURemoteCmd.CMD_PAUSE,
          time: syncTime.now()
        })
        break
      case 'import': {
        const data = sessionStorage.getItem('viu-ls-user-data')
        if (data == null) {
          dialog('Import Error', 'No data to import', ['OK'], false)
          break
        }

        dataConn.send(<BURemoteImportReqData>{
          cmd: BURemoteCmd.CMD_IMPORT_REQ,
          time: syncTime.now(),
          data
        })
        break
      }
      case 'export':
        dataConn.send(<BURemoteExportReqData>{
          cmd: BURemoteCmd.CMD_EXPORT_REQ,
          time: syncTime.now()
        })
        break
      case 'relSeek':
        dataConn.send(<BURemoteRelativeSeekData>{
          cmd: BURemoteCmd.CMD_RELATIVE_SEEK,
          time: syncTime.now(),
          offset: parseInt(value) ?? 0
        })
        break
      case 'relVol':
        dataConn.send(<BURemoteRelativeVolumeData>{
          cmd: BURemoteCmd.CMD_RELATIVE_VOLUME,
          time: syncTime.now(),
          value: parseFloat(value) ?? 0
        })
        break
      default:
        console.warn('invalid action:', name)
        break
    }
  })

  peerControlForm.find('[name="time"]')
    .on('mousedown', () => { isSeeking = true })
    .on('touchstart', () => { isSeeking = true })
    .on('mouseup', () => { isSeeking = false })
    .on('touchend', () => { isSeeking = false })
    .on('change', () => {
      if (dataConn == null) {
        dialog('Error', 'Not connected to any peer', ['OK'], false)
        return
      }

      dataConn.send(<BURemoteAbsoluteSeekData>{
        cmd: BURemoteCmd.CMD_ABSOLUTE_SEEK,
        time: syncTime.now(),
        pos: Number(peerControlForm.find('[name="time"]').val())
      })
    })

  function updateTextTrack(): void {
    requestAnimationFrame(updateTextTrack)

    if (performance.now() - lastTextTrackUpdate < 500 || streamVideo.paused) return

    if (currTextTrackCue != null) streamTextTrack.removeCue(currTextTrackCue)

    currTextTrackCue = new VTTCue(streamVideo.currentTime, streamVideo.currentTime + 0.5, currSubtitle)
    streamTextTrack.addCue(currTextTrackCue)
  }

  updateTextTrack()
})()
