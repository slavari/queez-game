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
  references: number
  cleanupTimer: ReturnType<typeof setTimeout> | null
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
    activeSession = { key, references: 0, cleanupTimer: null, session }
    session.start()
  }

  if (activeSession.cleanupTimer) clearTimeout(activeSession.cleanupTimer)
  activeSession.cleanupTimer = null
  activeSession.references += 1

  let released = false
  return () => {
    if (released || !activeSession || activeSession.key !== key) return
    released = true
    activeSession.references = Math.max(0, activeSession.references - 1)
    if (activeSession.references > 0) return

    activeSession.cleanupTimer = setTimeout(() => {
      if (!activeSession || activeSession.key !== key || activeSession.references > 0) return
      activeSession.session.stop(false)
      activeSession = null
    }, 250)
  }
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
