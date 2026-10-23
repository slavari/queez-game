export type TransportError = {
  type: string
  message: string
}

export interface P2PConnection {
  readonly remotePeerId: string
  readonly open: boolean
  send(data: unknown): void
  close(): void
  onOpen(callback: () => void): void
  onData(callback: (data: unknown) => void): void
  onClose(callback: () => void): void
  onError(callback: (error: TransportError) => void): void
}

export interface P2PPeer {
  connect(remotePeerId: string): P2PConnection
  destroy(): void
  onOpen(callback: (peerId: string) => void): void
  onConnection(callback: (connection: P2PConnection) => void): void
  onError(callback: (error: TransportError) => void): void
  onDisconnected(callback: () => void): void
}

export type PeerFactory = (peerId?: string) => P2PPeer
