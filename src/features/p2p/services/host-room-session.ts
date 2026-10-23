import {
  PROTOCOL_VERSION,
  parseClientMessage,
  type JoinRejectReason,
  type ServerMessage,
} from '@/features/p2p/protocol/messages'
import type { P2PConnection, P2PPeer, PeerFactory } from '@/features/p2p/transport/types'
import type { Participant, RoomSnapshot } from '@/features/room/model/types'
import type { SteamProfile } from '@/features/steam-profile/model/types'

type SessionStatus = 'STARTING' | 'CONNECTED' | 'ERROR'

type HostRoomSessionOptions = {
  roomId: string
  participantId: string
  profile: SteamProfile
  peerFactory: PeerFactory
  disconnectGraceMs?: number
  startTimeoutMs?: number
  onSnapshot: (room: RoomSnapshot) => void
  onStatus: (status: SessionStatus, message?: string) => void
}

export class HostRoomSession {
  private peer: P2PPeer | null = null
  private room: RoomSnapshot
  private readonly connections = new Set<P2PConnection>()
  private readonly participantConnections = new Map<string, P2PConnection>()
  private readonly connectionParticipants = new Map<P2PConnection, string>()
  private readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private startTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  constructor(private readonly options: HostRoomSessionOptions) {
    const host: Participant = {
      id: options.participantId,
      ...options.profile,
      role: 'HOST',
      status: 'CONNECTED',
    }
    this.room = {
      id: options.roomId,
      hostId: host.id,
      participants: [host],
      status: 'LOBBY',
      version: 1,
    }
  }

  start() {
    if (this.peer || this.stopped) return
    this.options.onStatus('STARTING')
    const peer = this.options.peerFactory(this.options.roomId)
    this.peer = peer
    this.startTimer = setTimeout(() => {
      if (this.stopped || this.peer !== peer) return
      this.options.onStatus(
        'ERROR',
        'The signaling service did not respond. Check your network and try again.',
      )
      peer.destroy()
      this.peer = null
    }, this.options.startTimeoutMs ?? 12_000)
    peer.onOpen(() => {
      if (this.stopped || this.peer !== peer) return
      this.clearStartTimer()
      this.options.onSnapshot(this.snapshot())
      this.options.onStatus('CONNECTED')
    })
    peer.onConnection((connection) => {
      if (this.peer === peer) this.attachConnection(connection)
    })
    peer.onDisconnected(() => {
      if (!this.stopped && this.peer === peer)
        this.options.onStatus('ERROR', 'PeerJS signaling connection was lost.')
    })
    peer.onError((error) => {
      if (this.stopped || this.peer !== peer) return
      this.clearStartTimer()
      const message =
        error.type === 'unavailable-id'
          ? 'This room ID is already in use. Create a new room.'
          : 'The P2P host could not start. Please try again.'
      this.options.onStatus('ERROR', message)
    })
  }

  stop() {
    if (this.stopped) return
    this.stopped = true
    this.clearStartTimer()
    for (const timer of this.disconnectTimers.values()) clearTimeout(timer)
    this.disconnectTimers.clear()
    for (const connection of this.connections) connection.close()
    this.connections.clear()
    this.peer?.destroy()
    this.peer = null
  }

  private clearStartTimer() {
    if (this.startTimer) clearTimeout(this.startTimer)
    this.startTimer = null
  }

  private attachConnection(connection: P2PConnection) {
    if (this.stopped) {
      connection.close()
      return
    }

    this.connections.add(connection)
    connection.onData((data) => this.handleMessage(connection, data))
    connection.onClose(() => this.handleConnectionClosed(connection))
    connection.onError(() => this.handleConnectionClosed(connection))
  }

  private handleMessage(connection: P2PConnection, data: unknown) {
    const message = parseClientMessage(data)
    if (!message) {
      this.reject(connection, 'INVALID_REQUEST')
      return
    }

    if (message.type === 'LEAVE_ROOM') {
      const boundParticipant = this.connectionParticipants.get(connection)
      if (boundParticipant !== message.payload.participantId) {
        this.reject(connection, 'INVALID_REQUEST')
        return
      }
      this.markDisconnected(boundParticipant)
      connection.close()
      return
    }

    const { participantId, profile } = message.payload
    const alreadyBoundParticipant = this.connectionParticipants.get(connection)
    if (alreadyBoundParticipant && alreadyBoundParticipant !== participantId) {
      this.reject(connection, 'INVALID_REQUEST')
      return
    }
    const participantById = this.room.participants.find(
      (participant) => participant.id === participantId,
    )
    const participantBySteam = this.room.participants.find(
      (participant) => participant.steamId === profile.steamId,
    )

    if (participantById && participantById.steamId !== profile.steamId) {
      this.reject(connection, 'INVALID_REQUEST')
      return
    }

    if (participantBySteam && participantBySteam.id !== participantId) {
      this.reject(connection, 'DUPLICATE_PROFILE')
      return
    }

    const existingTimer = this.disconnectTimers.get(participantId)
    if (existingTimer) clearTimeout(existingTimer)
    this.disconnectTimers.delete(participantId)

    const previousConnection = this.participantConnections.get(participantId)
    if (previousConnection && previousConnection !== connection) previousConnection.close()

    this.connectionParticipants.set(connection, participantId)
    this.participantConnections.set(participantId, connection)

    if (participantById) {
      this.room = {
        ...this.room,
        version: this.room.version + 1,
        participants: this.room.participants.map((participant) =>
          participant.id === participantId
            ? { ...participant, ...profile, role: 'GUEST', status: 'CONNECTED' }
            : participant,
        ),
      }
    } else {
      this.room = {
        ...this.room,
        version: this.room.version + 1,
        participants: [
          ...this.room.participants,
          { id: participantId, ...profile, role: 'GUEST', status: 'CONNECTED' },
        ],
      }
    }

    const room = this.snapshot()
    this.send(connection, {
      version: PROTOCOL_VERSION,
      type: 'JOIN_ACCEPTED',
      payload: { participantId, room },
    })
    this.publishSnapshot()
  }

  private handleConnectionClosed(connection: P2PConnection) {
    this.connections.delete(connection)
    const participantId = this.connectionParticipants.get(connection)
    this.connectionParticipants.delete(connection)
    if (!participantId || this.participantConnections.get(participantId) !== connection) return

    this.participantConnections.delete(participantId)
    const timer = setTimeout(
      () => this.markDisconnected(participantId),
      this.options.disconnectGraceMs ?? 5_000,
    )
    this.disconnectTimers.set(participantId, timer)
  }

  private markDisconnected(participantId: string) {
    const participant = this.room.participants.find((item) => item.id === participantId)
    if (!participant || participant.role === 'HOST' || participant.status === 'DISCONNECTED') return

    const timer = this.disconnectTimers.get(participantId)
    if (timer) clearTimeout(timer)
    this.disconnectTimers.delete(participantId)
    this.participantConnections.delete(participantId)
    this.room = {
      ...this.room,
      version: this.room.version + 1,
      participants: this.room.participants.map((item) =>
        item.id === participantId ? { ...item, status: 'DISCONNECTED' } : item,
      ),
    }
    const event: ServerMessage = {
      version: PROTOCOL_VERSION,
      type: 'PARTICIPANT_DISCONNECTED',
      payload: { participantId, roomVersion: this.room.version },
    }
    this.broadcast(event)
    this.publishSnapshot()
  }

  private publishSnapshot() {
    const room = this.snapshot()
    this.options.onSnapshot(room)
    this.broadcast({
      version: PROTOCOL_VERSION,
      type: 'ROOM_SNAPSHOT',
      payload: { room },
    })
  }

  private reject(connection: P2PConnection, reason: JoinRejectReason) {
    this.send(connection, {
      version: PROTOCOL_VERSION,
      type: 'JOIN_REJECTED',
      payload: { reason },
    })
    connection.close()
  }

  private broadcast(message: ServerMessage) {
    for (const connection of this.connections) {
      if (connection.open && this.connectionParticipants.has(connection))
        this.send(connection, message)
    }
  }

  private send(connection: P2PConnection, message: ServerMessage) {
    try {
      connection.send(message)
    } catch {
      connection.close()
    }
  }

  private snapshot(): RoomSnapshot {
    return {
      ...this.room,
      participants: this.room.participants.map((participant) => ({ ...participant })),
    }
  }
}
