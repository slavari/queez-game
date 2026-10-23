import {
  PROTOCOL_VERSION,
  parseServerMessage,
  type ClientMessage,
} from '@/features/p2p/protocol/messages'
import type { P2PConnection, P2PPeer, PeerFactory } from '@/features/p2p/transport/types'
import type { RoomSnapshot } from '@/features/room/model/types'
import type { SteamProfile } from '@/features/steam-profile/model/types'
import { createSecureId } from '@/shared/lib/ids'

type GuestStatus =
  'STARTING' | 'CONNECTED' | 'RECONNECTING' | 'HOST_UNAVAILABLE' | 'REJECTED' | 'ERROR'

type GuestRoomSessionOptions = {
  roomId: string
  participantId: string
  profile: SteamProfile
  peerFactory: PeerFactory
  retryDelaysMs?: number[]
  joinTimeoutMs?: number
  peerOpenTimeoutMs?: number
  onSnapshot: (room: RoomSnapshot) => void
  onStatus: (status: GuestStatus, message?: string) => void
}

const rejectionMessages = {
  DUPLICATE_PROFILE: 'This Steam profile is already active in the room.',
  INVALID_REQUEST: 'The host rejected an invalid connection request.',
  ROOM_UNAVAILABLE: 'The room is not accepting participants.',
} as const

export class GuestRoomSession {
  private peer: P2PPeer | null = null
  private connection: P2PConnection | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private joinTimer: ReturnType<typeof setTimeout> | null = null
  private peerOpenTimer: ReturnType<typeof setTimeout> | null = null
  private attempt = 0
  private currentVersion = 0
  private stopped = false
  private terminal = false

  constructor(private readonly options: GuestRoomSessionOptions) {}

  start() {
    if (this.peer || this.stopped) return
    this.options.onStatus('STARTING')
    this.startPeer()
  }

  private startPeer() {
    if (this.peer || this.stopped || this.terminal) return
    const peer = this.options.peerFactory(createSecureId('guest-', 24))
    this.peer = peer
    this.peerOpenTimer = setTimeout(() => {
      if (this.peer === peer) {
        this.scheduleReconnect('The signaling service did not respond.')
      }
    }, this.options.peerOpenTimeoutMs ?? 10_000)
    peer.onOpen(() => {
      if (this.peer !== peer) return
      this.clearPeerOpenTimeout()
      this.connectToHost()
    })
    peer.onDisconnected(() => {
      if (this.peer === peer) this.scheduleReconnect('The signaling service disconnected.')
    })
    peer.onError((error) => {
      if (this.peer !== peer) return
      if (this.stopped || this.terminal) return
      if (error.type === 'peer-unavailable') {
        this.scheduleReconnect('The host is unavailable.')
      } else {
        this.options.onStatus('ERROR', 'The P2P connection failed. Please try again.')
      }
    })
  }

  stop(sendLeave = true) {
    if (this.stopped) return
    this.stopped = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.joinTimer) clearTimeout(this.joinTimer)
    this.clearPeerOpenTimeout()

    if (sendLeave && this.connection?.open) {
      const message: ClientMessage = {
        version: PROTOCOL_VERSION,
        type: 'LEAVE_ROOM',
        payload: { participantId: this.options.participantId },
      }
      this.connection.send(message)
    }

    this.connection?.close()
    this.peer?.destroy()
    this.connection = null
    this.peer = null
  }

  private connectToHost() {
    if (!this.peer || this.stopped || this.terminal) return
    this.connection?.close()
    const connection = this.peer.connect(this.options.roomId)
    this.connection = connection

    connection.onOpen(() => {
      if (this.stopped || this.connection !== connection) return
      const request: ClientMessage = {
        version: PROTOCOL_VERSION,
        type: 'JOIN_REQUEST',
        payload: {
          participantId: this.options.participantId,
          profile: this.options.profile,
        },
      }
      connection.send(request)
      this.startJoinTimeout()
    })
    connection.onData((data) => this.handleMessage(connection, data))
    connection.onClose(() => {
      if (!this.stopped && !this.terminal && this.connection === connection) {
        this.scheduleReconnect('Connection to the host was lost.')
      }
    })
    connection.onError(() => {
      if (!this.stopped && !this.terminal && this.connection === connection) {
        this.scheduleReconnect('Connection to the host failed.')
      }
    })
  }

  private handleMessage(connection: P2PConnection, data: unknown) {
    if (connection !== this.connection || this.stopped) return
    const message = parseServerMessage(data)
    if (!message) {
      this.terminal = true
      this.options.onStatus('ERROR', 'The host sent an invalid response.')
      connection.close()
      return
    }

    if (message.type === 'JOIN_REJECTED') {
      this.terminal = true
      this.clearJoinTimeout()
      this.options.onStatus('REJECTED', rejectionMessages[message.payload.reason])
      connection.close()
      return
    }

    if (message.type === 'PARTICIPANT_DISCONNECTED') return

    const room = message.payload.room
    if (room.id !== this.options.roomId || room.version <= this.currentVersion) return

    this.currentVersion = room.version
    this.attempt = 0
    this.clearJoinTimeout()
    this.options.onSnapshot(room)
    this.options.onStatus('CONNECTED')
  }

  private startJoinTimeout() {
    this.clearJoinTimeout()
    this.joinTimer = setTimeout(() => {
      if (!this.stopped && !this.terminal)
        this.scheduleReconnect('The host did not respond in time.')
    }, this.options.joinTimeoutMs ?? 10_000)
  }

  private clearJoinTimeout() {
    if (this.joinTimer) clearTimeout(this.joinTimer)
    this.joinTimer = null
  }

  private clearPeerOpenTimeout() {
    if (this.peerOpenTimer) clearTimeout(this.peerOpenTimer)
    this.peerOpenTimer = null
  }

  private scheduleReconnect(message: string) {
    if (this.stopped || this.terminal || this.reconnectTimer) return
    this.clearJoinTimeout()
    this.clearPeerOpenTimeout()
    const delays = this.options.retryDelaysMs ?? [1_000, 2_000, 4_000, 8_000, 10_000]
    const delay = delays[this.attempt]

    if (delay === undefined) {
      this.terminal = true
      this.options.onStatus(
        'HOST_UNAVAILABLE',
        'The host is unavailable. Check the invite link or try later.',
      )
      this.connection?.close()
      this.connection = null
      this.peer?.destroy()
      this.peer = null
      return
    }

    this.attempt += 1
    this.options.onStatus('RECONNECTING', message)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.startPeer()
    }, delay)
    this.connection?.close()
    this.connection = null
    this.peer?.destroy()
    this.peer = null
  }
}
