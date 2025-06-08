import Logger from '@ext/lib/logger'
import { playerGetCurrentTime, playerGetDuration, playerGetMute, playerGetSubtitle, playerGetVolume, playerIsPlaying, playerPause, playerPlay, playerSeek, playerSetMute, playerSetVolume } from '@ext/site/viu/module/player'
import { VIU_STATE } from '@ext/site/viu/state'
import { BURemoteCmd } from '@sh/bu-remote/cmd'
import { PEER_CONFIG } from '@sh/bu-remote/config'
import { BURemoteData, BURemoteExportRspData, BURemoteImportRspData, BURemotePlayerInfoData, BURemoteSyncTimeRspData } from '@sh/bu-remote/data'
import Peer, { DataConnection, MediaConnection } from 'peerjs'

const logger = new Logger('VIU-REMOTE')

let peer: Peer

function onDataConnection(dataConn: DataConnection): void {
  let updateLoop: number | null = null
  let streamId: string | null = null
  let streamConn: MediaConnection | null = null
  let currentStream: MediaStream | null = null
  let streamBeginTime = 0
  let lastSyncTime = Date.now()
  let lastStreamIdSyncTime = 0

  function updateStream(): void {
    const { stream } = VIU_STATE

    if (stream == null || streamId == null) return

    // Close open connection on stream change
    if (currentStream !== stream) {
      logger.info('stream changed, closing existing connection if open')

      currentStream = stream

      streamConn?.close()
      streamConn = null
    }

    // Close connection on desync
    if (streamConn != null) {
      if (lastStreamIdSyncTime - streamBeginTime < 5e3) return

      logger.warn('stream desync, force close stream connection:', streamConn)
      streamConn.close()
    }

    // Open new stream connection
    streamBeginTime = Date.now()

    const newStreamConn = peer.call(streamId, stream.clone())
    streamConn = newStreamConn
    streamConn.on('close', () => {
      if (streamConn !== newStreamConn) return

      logger.info('close stream connection:', streamConn)
      streamConn = null
    })

    logger.info('open stream connection:', streamConn)
  }

  function connUpdate(): void {
    if (Date.now() - lastSyncTime > 5e3) {
      dataConn.close()
      return
    }

    updateStream()

    const p = !playerIsPlaying()
    const v = playerGetVolume()
    const c = playerGetCurrentTime()
    const d = playerGetDuration()
    const s = playerGetSubtitle()

    dataConn.send(<BURemotePlayerInfoData>{
      cmd: BURemoteCmd.CMD_PLAYER_INFO,
      time: Date.now(),
      p, v, c, d, s
    })
  }

  dataConn.on('open', () => {
    updateLoop = window.setInterval(connUpdate, 100)

    VIU_STATE.connectedPeer++
  })
  dataConn.on('close', () => {
    VIU_STATE.connectedPeer--

    if (updateLoop != null) window.clearInterval(updateLoop)

    if (streamConn != null) {
      logger.info('data connection closed, close stream connection:', streamConn)

      streamConn.close()
      streamConn = null
    }
    streamId = null

    VIU_STATE.pauseByDisconnect = playerIsPlaying() ?? false
    playerPause()
  })
  dataConn.on('data', <(data: unknown) => void>((data: BURemoteData) => {
    if (typeof data !== 'object' || data == null) {
      dataConn.close()
      return
    }

    switch (data.cmd) {
      case BURemoteCmd.CMD_STREAM_ID:
        streamId = data.id
        lastStreamIdSyncTime = Date.now()

        if (!VIU_STATE.pauseByDisconnect) return
        VIU_STATE.pauseByDisconnect = false

        if (data.reconnect) playerPlay()
        return
      case BURemoteCmd.CMD_SYNC_TIME_REQ:
        lastSyncTime = Date.now()
        dataConn.send(<BURemoteSyncTimeRspData>{
          cmd: BURemoteCmd.CMD_SYNC_TIME_RSP,
          time: Date.now(),
          sent: data.time
        })
        return
      case BURemoteCmd.CMD_IMPORT_REQ:
        try {
          importUserData(data.data)
          dataConn.send(<BURemoteImportRspData>{
            cmd: BURemoteCmd.CMD_IMPORT_RSP,
            time: Date.now()
          })
        } catch (err) {
          dataConn.send(<BURemoteImportRspData>{
            cmd: BURemoteCmd.CMD_IMPORT_RSP,
            time: Date.now(),
            err: (<Error>err).message
          })
        }
        return
      case BURemoteCmd.CMD_EXPORT_REQ:
        try {
          dataConn.send(<BURemoteExportRspData>{
            cmd: BURemoteCmd.CMD_EXPORT_RSP,
            time: Date.now(),
            data: exportUserData()
          })
        } catch (err) {
          dataConn.send(<BURemoteExportRspData>{
            cmd: BURemoteCmd.CMD_EXPORT_RSP,
            time: Date.now(),
            err: (<Error>err).message
          })
        }
        return
    }

    switch (data.cmd) {
      case BURemoteCmd.CMD_PLAY:
        playerPlay()
        return
      case BURemoteCmd.CMD_PAUSE:
        playerPause()
        playerSeek(playerGetCurrentTime() - (Date.now() - data.time) / 1e3)
        return
      case BURemoteCmd.CMD_RELATIVE_SEEK:
        playerSeek(Math.max(0, Math.min(playerGetDuration(), playerGetCurrentTime() + data.offset)))
        return
      case BURemoteCmd.CMD_ABSOLUTE_SEEK:
        playerSeek(Math.max(0, Math.min(playerGetDuration(), data.pos)))
        return
      case BURemoteCmd.CMD_RELATIVE_VOLUME:
        if (data.value > 0 && playerGetMute()) playerSetMute(false)
        playerSetVolume(Math.max(0, Math.min(100, playerGetVolume() + data.value)))
        return
      case BURemoteCmd.CMD_ABSOLUTE_VOLUME:
        if (data.value > 0 && playerGetMute()) playerSetMute(false)
        playerSetVolume(Math.max(0, Math.min(100, data.value)))
        return
    }

    logger.warn('invalid data:', data)
    dataConn.close()
  }))
}

function createPeer(): void {
  peer = new Peer(PEER_CONFIG)

  peer.on('open', () => VIU_STATE.peerId = peer.id)
  peer.on('disconnected', () => {
    peer.destroy()
    setTimeout(createPeer, 5e3)
  })
  peer.on('connection', onDataConnection)
  peer.on('error', error => logger.warn('peer connection error:', error))
}

export default function initViuRemoteModule(): void {
  createPeer()
}
