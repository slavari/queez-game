import { useConnectionStore } from '@/features/p2p/model/connection-store'
import { GuestRoomSession } from '@/features/p2p/services/guest-room-session'
import { HostRoomSession } from '@/features/p2p/services/host-room-session'
import { createPeerJsPeer } from '@/features/p2p/transport/peerjs-transport'
import { useRoomStore } from '@/features/room/model/room-store'
import type { SteamProfile } from '@/features/steam-profile/model/types'

type RoomSessionConfig = {
  mode: 'HOST' | 'GUEST'
  roomId: string
  participantId: string
  profile: SteamProfile
}

type ManagedSession = {
  key: string
  session: { start(): void; stop(sendLeave?: boolean): void }
}

let activeSession: ManagedSession | null = null

function createSession(config: RoomSessionConfig) {
  const common = {
    roomId: config.roomId,
    participantId: config.participantId,
    profile: config.profile,
    peerFactory: createPeerJsPeer,
    onSnapshot: useRoomStore.getState().applySnapshot,
  }

  if (config.mode === 'HOST') {
    return new HostRoomSession({
      ...common,
      onStatus: (phase, message) => useConnectionStore.getState().setConnection(phase, message),
    })
  }

  return new GuestRoomSession({
    ...common,
    onStatus: (phase, message) => useConnectionStore.getState().setConnection(phase, message),
  })
}

export function acquireRoomSession(config: RoomSessionConfig) {
  const key = `${config.mode}:${config.roomId}:${config.participantId}:${config.profile.steamId}`

  if (activeSession && activeSession.key !== key) {
    activeSession.session.stop(false)
    activeSession = null
  }

  if (!activeSession) {
    useRoomStore.getState().reset()
    useConnectionStore.getState().setConnection('STARTING')
    const session = createSession(config)
    activeSession = { key, session }
    try {
      session.start()
    } catch (error) {
      console.error('Failed to start the P2P room session:', error)
      activeSession = null
      useConnectionStore
        .getState()
        .setConnection('ERROR', 'P2P could not start in this browser. Reload and try again.')
    }
  }

  // The session is intentionally not tied to React effect cleanup. StrictMode and
  // route hydration can run transient cleanups while the user is still in the room.
  // It is stopped explicitly on leave, when another room is acquired, or on pagehide.
  return () => undefined
}

export function leaveActiveRoom() {
  activeSession?.session.stop(true)
  activeSession = null
  useRoomStore.getState().reset()
  useConnectionStore.getState().reset()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    activeSession?.session.stop(false)
    activeSession = null
  })
}
