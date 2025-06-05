import { BURemoteCmd } from './cmd'

export interface BURemoteDataBase<C extends BURemoteCmd> {
  cmd: C
  time: number
}

export interface BURemoteStreamIdData extends BURemoteDataBase<BURemoteCmd.CMD_STREAM_ID> {
  id: string
  reconnect: boolean
}

export interface BURemoteSyncTimeReqData extends BURemoteDataBase<BURemoteCmd.CMD_SYNC_TIME_REQ> { }

export interface BURemoteSyncTimeRspData extends BURemoteDataBase<BURemoteCmd.CMD_SYNC_TIME_RSP> {
  sent: number
}

export interface BURemoteImportReqData extends BURemoteDataBase<BURemoteCmd.CMD_IMPORT_REQ> {
  data: string
}

export interface BURemoteImportRspData extends BURemoteDataBase<BURemoteCmd.CMD_IMPORT_RSP> {
  err?: string
}

export interface BURemoteExportReqData extends BURemoteDataBase<BURemoteCmd.CMD_EXPORT_REQ> { }

export interface BURemoteExportRspData extends BURemoteDataBase<BURemoteCmd.CMD_EXPORT_RSP> {
  err?: string
  data?: string
}

export interface BURemotePlayerInfoData extends BURemoteDataBase<BURemoteCmd.CMD_PLAYER_INFO> {
  p: boolean // Paused
  v: number // Volume
  c: number // Current time
  d: number // Duration
  s: string // Subtitle
}

export interface BURemotePlayData extends BURemoteDataBase<BURemoteCmd.CMD_PLAY> { }

export interface BURemotePauseData extends BURemoteDataBase<BURemoteCmd.CMD_PAUSE> { }

export interface BURemoteRelativeSeekData extends BURemoteDataBase<BURemoteCmd.CMD_RELATIVE_SEEK> {
  offset: number
}

export interface BURemoteAbsoluteSeekData extends BURemoteDataBase<BURemoteCmd.CMD_ABSOLUTE_SEEK> {
  pos: number
}

export interface BURemoteRelativeVolumeData extends BURemoteDataBase<BURemoteCmd.CMD_RELATIVE_VOLUME> {
  value: number
}

export interface BURemoteAbsoluteVolumeData extends BURemoteDataBase<BURemoteCmd.CMD_ABSOLUTE_VOLUME> {
  value: number
}

export type BURemoteData =
  BURemoteStreamIdData |
  BURemoteSyncTimeReqData |
  BURemoteSyncTimeRspData |
  BURemoteImportReqData |
  BURemoteImportRspData |
  BURemoteExportReqData |
  BURemoteExportRspData |
  BURemotePlayerInfoData |
  BURemotePlayData |
  BURemotePauseData |
  BURemoteRelativeSeekData |
  BURemoteAbsoluteSeekData |
  BURemoteRelativeVolumeData |
  BURemoteAbsoluteVolumeData
