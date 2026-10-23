import { PROTOCOL_VERSION } from '@/features/p2p/protocol/messages'
import { GuestRoomSession } from '@/features/p2p/services/guest-room-session'
import { HostRoomSession } from '@/features/p2p/services/host-room-session'
import type {
  P2PConnection,
  P2PPeer,
  PeerFactory,
  TransportError,
} from '@/features/p2p/transport/types'
import type { RoomSnapshot } from '@/features/room/model/types'

class FakeConnection implements P2PConnection {
  remotePeerId: string
  open = false
  counterpart: FakeConnection | null = null
  private openHandlers: Array<() => void> = []
  private dataHandlers: Array<(data: unknown) => void> = []
  private closeHandlers: Array<() => void> = []
  private errorHandlers: Array<(error: TransportError) => void> = []

  constructor(remotePeerId: string) {
    this.remotePeerId = remotePeerId
  }

  send(data: unknown) {
    if (!this.open || !this.counterpart) throw new Error('Connection is closed')
    const counterpart = this.counterpart
    queueMicrotask(() => counterpart.dataHandlers.forEach((handler) => handler(data)))
  }

  close() {
    if (!this.open) return
    this.open = false
    const counterpart = this.counterpart
    queueMicrotask(() => this.closeHandlers.forEach((handler) => handler()))
    if (counterpart?.open) {
      counterpart.open = false
      queueMicrotask(() => counterpart.closeHandlers.forEach((handler) => handler()))
    }
  }

  activate() {
    this.open = true
    this.openHandlers.forEach((handler) => handler())
  }

  onOpen(callback: () => void) {
    this.openHandlers.push(callback)
  }

  onData(callback: (data: unknown) => void) {
    this.dataHandlers.push(callback)
  }

  onClose(callback: () => void) {
    this.closeHandlers.push(callback)
  }

  onError(callback: (error: TransportError) => void) {
    this.errorHandlers.push(callback)
  }
}

class FakePeer implements P2PPeer {
  private openHandlers: Array<(peerId: string) => void> = []
  private connectionHandlers: Array<(connection: P2PConnection) => void> = []
  private errorHandlers: Array<(error: TransportError) => void> = []
  private disconnectedHandlers: Array<() => void> = []

  constructor(
    readonly id: string,
    private readonly network: FakeNetwork,
  ) {
    queueMicrotask(() => this.openHandlers.forEach((handler) => handler(id)))
  }

  connect(remotePeerId: string) {
    return this.network.connect(this, remotePeerId)
  }

  destroy() {
    this.network.remove(this.id)
  }

  onOpen(callback: (peerId: string) => void) {
    this.openHandlers.push(callback)
  }

  onConnection(callback: (connection: P2PConnection) => void) {
    this.connectionHandlers.push(callback)
  }

  onError(callback: (error: TransportError) => void) {
    this.errorHandlers.push(callback)
  }

  onDisconnected(callback: () => void) {
    this.disconnectedHandlers.push(callback)
  }

  receive(connection: P2PConnection) {
    this.connectionHandlers.forEach((handler) => handler(connection))
  }

  fail(error: TransportError) {
    this.errorHandlers.forEach((handler) => handler(error))
  }
}

class FakeNetwork {
  peers = new Map<string, FakePeer>()
  serverConnections: FakeConnection[] = []
  private guestCount = 0

  factory: PeerFactory = (requestedId) => {
    const id = requestedId ?? `guest-peer-${++this.guestCount}`
    const peer = new FakePeer(id, this)
    this.peers.set(id, peer)
    return peer
  }

  connect(source: FakePeer, remotePeerId: string) {
    const local = new FakeConnection(remotePeerId)
    const remote = new FakeConnection(source.id)
    local.counterpart = remote
    remote.counterpart = local
    const destination = this.peers.get(remotePeerId)

    queueMicrotask(() => {
      if (!destination) {
        source.fail({ type: 'peer-unavailable', message: 'Missing peer' })
        return
      }
      this.serverConnections.push(remote)
      destination.receive(remote)
      remote.activate()
      local.activate()
    })
    return local
  }

  remove(id: string) {
    this.peers.delete(id)
  }
}

const hostProfile = {
  steamId: '76561197960287930',
  nickname: 'Host',
  avatarUrl: 'https://avatars.fastly.steamstatic.com/host.jpg',
  profileUrl: 'https://steamcommunity.com/id/host/',
}

const guestProfile = {
  steamId: '76561198000000001',
  nickname: 'Guest',
  avatarUrl: 'https://avatars.fastly.steamstatic.com/guest.jpg',
  profileUrl: 'https://steamcommunity.com/id/guest/',
}

const flushMessages = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve()
}

describe('host and guest room sessions', () => {
  afterEach(() => vi.useRealTimers())

  it('joins, synchronizes, disconnects, reconnects and ignores stale snapshots', async () => {
    vi.useFakeTimers()
    const network = new FakeNetwork()
    const hostSnapshots: RoomSnapshot[] = []
    const guestSnapshots: RoomSnapshot[] = []
    const guestStatuses: string[] = []
    const roomId = 'gp-1234567890abcdefghijklmn'

    const host = new HostRoomSession({
      roomId,
      participantId: 'participant-host-123',
      profile: hostProfile,
      peerFactory: network.factory,
      disconnectGraceMs: 50,
      onSnapshot: (room) => hostSnapshots.push(room),
      onStatus: () => undefined,
    })
    host.start()

    const guest = new GuestRoomSession({
      roomId,
      participantId: 'participant-guest-123',
      profile: guestProfile,
      peerFactory: network.factory,
      retryDelaysMs: [0],
      onSnapshot: (room) => guestSnapshots.push(room),
      onStatus: (status) => guestStatuses.push(status),
    })
    guest.start()
    await flushMessages()

    expect(guestStatuses).toContain('CONNECTED')
    expect(hostSnapshots.at(-1)?.participants).toHaveLength(2)
    expect(hostSnapshots.at(-1)?.participants[0]?.role).toBe('HOST')
    expect(hostSnapshots.at(-1)?.participants[1]?.role).toBe('GUEST')
    expect(guestSnapshots.at(-1)?.participants.map((participant) => participant.nickname)).toEqual([
      'Host',
      'Guest',
    ])

    const newestRoom = guestSnapshots.at(-1)
    expect(newestRoom).toBeDefined()
    if (!newestRoom) return
    const snapshotCount = guestSnapshots.length
    network.serverConnections.at(-1)?.send({
      version: PROTOCOL_VERSION,
      type: 'ROOM_SNAPSHOT',
      payload: { room: { ...newestRoom, version: newestRoom.version - 1 } },
    })
    await flushMessages()
    expect(guestSnapshots).toHaveLength(snapshotCount)

    network.serverConnections.at(-1)?.close()
    await flushMessages()
    await vi.advanceTimersByTimeAsync(0)
    await flushMessages()
    expect(guestStatuses).toContain('RECONNECTING')
    expect(guestStatuses.at(-1)).toBe('CONNECTED')
    expect(hostSnapshots.at(-1)?.participants).toHaveLength(2)

    guest.stop(false)
    await flushMessages()
    await vi.advanceTimersByTimeAsync(50)
    expect(hostSnapshots.at(-1)?.participants[1]?.status).toBe('DISCONNECTED')

    const reconnectingGuest = new GuestRoomSession({
      roomId,
      participantId: 'participant-guest-123',
      profile: guestProfile,
      peerFactory: network.factory,
      onSnapshot: (room) => guestSnapshots.push(room),
      onStatus: () => undefined,
    })
    reconnectingGuest.start()
    await flushMessages()

    expect(hostSnapshots.at(-1)?.participants).toHaveLength(2)
    expect(hostSnapshots.at(-1)?.participants[1]?.status).toBe('CONNECTED')

    reconnectingGuest.stop()
    host.stop()
  })

  it('rejects a second active participant with the same Steam ID', async () => {
    const network = new FakeNetwork()
    const roomId = 'gp-1234567890abcdefghijklmn'
    const host = new HostRoomSession({
      roomId,
      participantId: 'participant-host-123',
      profile: hostProfile,
      peerFactory: network.factory,
      onSnapshot: () => undefined,
      onStatus: () => undefined,
    })
    host.start()

    const firstGuest = new GuestRoomSession({
      roomId,
      participantId: 'participant-guest-one',
      profile: guestProfile,
      peerFactory: network.factory,
      onSnapshot: () => undefined,
      onStatus: () => undefined,
    })
    const rejectedStatuses: string[] = []
    const duplicateGuest = new GuestRoomSession({
      roomId,
      participantId: 'participant-guest-two',
      profile: guestProfile,
      peerFactory: network.factory,
      onSnapshot: () => undefined,
      onStatus: (status) => rejectedStatuses.push(status),
    })

    firstGuest.start()
    await flushMessages()
    duplicateGuest.start()
    await flushMessages()

    expect(rejectedStatuses).toContain('REJECTED')

    duplicateGuest.stop(false)
    firstGuest.stop(false)
    host.stop()
  })
})
