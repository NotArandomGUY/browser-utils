export interface IViuState {
  loggedIn: boolean

  ccsProductIdMap: Map<string, string>
  streamSourceMap: Map<string, string>

  currentProductId: string
  peerId: string
  connectedPeer: number
  pauseByDisconnect: boolean

  stream: MediaStream | null
}

export const VIU_STATE: IViuState = {
  loggedIn: false,

  ccsProductIdMap: new Map(),
  streamSourceMap: new Map(),

  currentProductId: '',
  peerId: '',
  connectedPeer: 0,
  pauseByDisconnect: false,

  stream: null
}
