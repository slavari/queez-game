import type { SteamProfile } from '@/features/steam-profile/model/types'

export type ParticipantRole = 'HOST' | 'GUEST'
export type ParticipantStatus = 'CONNECTED' | 'DISCONNECTED'

export type Participant = SteamProfile & {
  id: string
  role: ParticipantRole
  status: ParticipantStatus
}

export type RoomSnapshot = {
  id: string
  hostId: string
  participants: Participant[]
  status: 'LOBBY'
  version: number
}
