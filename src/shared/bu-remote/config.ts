import type { PeerOptions } from 'peerjs'

export const PEER_CONFIG: PeerOptions = {
  host: '127.0.0.1',
  port: 443,
  path: '/api/service/peer',
  secure: true,
  key: ''
}

export const FRAME_CONFIG = {
  domains: []
}