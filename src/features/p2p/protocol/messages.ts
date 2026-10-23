import { isSteamProfile, type SteamProfile } from '@/features/steam-profile/model/types'
import type { Participant, RoomSnapshot } from '@/features/room/model/types'
import { isRoomId } from '@/features/room/lib/room-id'

export const PROTOCOL_VERSION = 1
export const MAX_MESSAGE_BYTES = 16 * 1024

export type JoinRejectReason = 'DUPLICATE_PROFILE' | 'INVALID_REQUEST' | 'ROOM_UNAVAILABLE'

export type JoinRequest = {
  version: typeof PROTOCOL_VERSION
  type: 'JOIN_REQUEST'
  payload: {
    participantId: string
    profile: SteamProfile
  }
}

export type LeaveRoom = {
  version: typeof PROTOCOL_VERSION
  type: 'LEAVE_ROOM'
  payload: { participantId: string }
}

export type ClientMessage = JoinRequest | LeaveRoom

export type JoinAccepted = {
  version: typeof PROTOCOL_VERSION
  type: 'JOIN_ACCEPTED'
  payload: { participantId: string; room: RoomSnapshot }
}

export type JoinRejected = {
  version: typeof PROTOCOL_VERSION
  type: 'JOIN_REJECTED'
  payload: { reason: JoinRejectReason }
}

export type RoomSnapshotMessage = {
  version: typeof PROTOCOL_VERSION
  type: 'ROOM_SNAPSHOT'
  payload: { room: RoomSnapshot }
}

export type ParticipantDisconnected = {
  version: typeof PROTOCOL_VERSION
  type: 'PARTICIPANT_DISCONNECTED'
  payload: { participantId: string; roomVersion: number }
}

export type ServerMessage =
  JoinAccepted | JoinRejected | RoomSnapshotMessage | ParticipantDisconnected

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isParticipant(value: unknown): value is Participant {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    value.id.length >= 8 &&
    value.id.length <= 80 &&
    (value.role === 'HOST' || value.role === 'GUEST') &&
    (value.status === 'CONNECTED' || value.status === 'DISCONNECTED') &&
    isSteamProfile(value)
  )
}

export function isRoomSnapshot(value: unknown): value is RoomSnapshot {
  if (!isRecord(value) || !Array.isArray(value.participants)) return false

  return (
    typeof value.id === 'string' &&
    isRoomId(value.id) &&
    typeof value.hostId === 'string' &&
    value.status === 'LOBBY' &&
    Number.isSafeInteger(value.version) &&
    Number(value.version) >= 1 &&
    value.participants.length <= 32 &&
    value.participants.every(isParticipant)
  )
}

function withinSizeLimit(value: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= MAX_MESSAGE_BYTES
  } catch {
    return false
  }
}

export function parseClientMessage(value: unknown): ClientMessage | null {
  if (!withinSizeLimit(value) || !isRecord(value)) return null
  if (value.version !== PROTOCOL_VERSION || !isRecord(value.payload)) return null

  if (value.type === 'JOIN_REQUEST') {
    const { participantId, profile } = value.payload
    if (
      typeof participantId === 'string' &&
      participantId.length >= 8 &&
      participantId.length <= 80 &&
      isSteamProfile(profile)
    ) {
      return {
        version: PROTOCOL_VERSION,
        type: 'JOIN_REQUEST',
        payload: { participantId, profile },
      }
    }
  }

  if (value.type === 'LEAVE_ROOM') {
    const { participantId } = value.payload
    if (
      typeof participantId === 'string' &&
      participantId.length >= 8 &&
      participantId.length <= 80
    ) {
      return { version: PROTOCOL_VERSION, type: 'LEAVE_ROOM', payload: { participantId } }
    }
  }

  return null
}

export function parseServerMessage(value: unknown): ServerMessage | null {
  if (!withinSizeLimit(value) || !isRecord(value)) return null
  if (value.version !== PROTOCOL_VERSION || !isRecord(value.payload)) return null

  if (value.type === 'JOIN_ACCEPTED') {
    const { participantId, room } = value.payload
    if (typeof participantId === 'string' && isRoomSnapshot(room)) return value as JoinAccepted
  }

  if (value.type === 'JOIN_REJECTED') {
    const reason = value.payload.reason
    if (
      reason === 'DUPLICATE_PROFILE' ||
      reason === 'INVALID_REQUEST' ||
      reason === 'ROOM_UNAVAILABLE'
    ) {
      return value as JoinRejected
    }
  }

  if (value.type === 'ROOM_SNAPSHOT' && isRoomSnapshot(value.payload.room)) {
    return value as RoomSnapshotMessage
  }

  if (value.type === 'PARTICIPANT_DISCONNECTED') {
    const { participantId, roomVersion } = value.payload
    if (typeof participantId === 'string' && Number.isSafeInteger(roomVersion)) {
      return value as ParticipantDisconnected
    }
  }

  return null
}
