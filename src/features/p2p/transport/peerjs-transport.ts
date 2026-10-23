import { Peer, type DataConnection } from 'peerjs'

import type {
  P2PConnection,
  P2PPeer,
  PeerFactory,
  TransportError,
} from '@/features/p2p/transport/types'

class PeerJsConnection implements P2PConnection {
  constructor(private readonly connection: DataConnection) {}

  get remotePeerId() {
    return this.connection.peer
  }

  get open() {
    return this.connection.open
  }

  send(data: unknown) {
    const result = this.connection.send(data)
    if (result) void result.catch(() => this.connection.close())
  }

  close() {
    this.connection.close()
  }

  onOpen(callback: () => void) {
    this.connection.on('open', callback)
  }

  onData(callback: (data: unknown) => void) {
    this.connection.on('data', callback)
  }

  onClose(callback: () => void) {
    this.connection.on('close', callback)
  }

  onError(callback: (error: TransportError) => void) {
    this.connection.on('error', (error) =>
      callback({ type: 'connection-error', message: error.message }),
    )
  }
}

class PeerJsPeer implements P2PPeer {
  private readonly peer: Peer

  constructor(peerId?: string) {
    const options = {
      debug: import.meta.env.DEV ? 3 : 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' },
        ],
        sdpSemantics: 'unified-plan' as const,
      },
    }
    this.peer = peerId ? new Peer(peerId, options) : new Peer(options)
  }

  connect(remotePeerId: string) {
    return new PeerJsConnection(
      this.peer.connect(remotePeerId, { reliable: true, serialization: 'json' }),
    )
  }

  destroy() {
    this.peer.destroy()
  }

  onOpen(callback: (peerId: string) => void) {
    this.peer.on('open', callback)
  }

  onConnection(callback: (connection: P2PConnection) => void) {
    this.peer.on('connection', (connection) => callback(new PeerJsConnection(connection)))
  }

  onError(callback: (error: TransportError) => void) {
    this.peer.on('error', (error) => callback({ type: error.type, message: error.message }))
  }

  onDisconnected(callback: () => void) {
    this.peer.on('disconnected', callback)
  }
}

export const createPeerJsPeer: PeerFactory = (peerId) => new PeerJsPeer(peerId)
