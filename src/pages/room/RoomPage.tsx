import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import heroBackground from '@/assets/game-world-hero.jpg'
import { useIdentityStore } from '@/features/participants/model/identity-store'
import { useConnectionStore } from '@/features/p2p/model/connection-store'
import {
  acquireRoomSession,
  leaveActiveRoom,
} from '@/features/p2p/services/room-session-controller'
import { createRoomInviteUrl, isRoomId } from '@/features/room/lib/room-id'
import { useRoomStore } from '@/features/room/model/room-store'
import type { Participant } from '@/features/room/model/types'
import { SteamProfileForm } from '@/features/steam-profile/ui/SteamProfileForm'

type RoomPageProps = {
  roomId: string
}

const phaseLabels = {
  IDLE: 'Waiting',
  STARTING: 'Starting P2P connection…',
  CONNECTED: 'Connected',
  RECONNECTING: 'Reconnecting…',
  DISCONNECTED: 'Disconnected',
  HOST_UNAVAILABLE: 'Host unavailable',
  REJECTED: 'Connection rejected',
  ERROR: 'Connection error',
} as const

function ParticipantRow({
  participant,
  hostAvailable,
}: {
  participant: Participant
  hostAvailable: boolean
}) {
  const effectiveStatus =
    participant.role === 'HOST' && !hostAvailable ? 'DISCONNECTED' : participant.status
  const connected = effectiveStatus === 'CONNECTED'

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <img
        src={participant.avatarUrl}
        alt=""
        className="size-12 rounded-xl bg-slate-800 object-cover ring-1 ring-white/15 sm:size-14"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={participant.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate font-bold text-white hover:text-cyan-200"
          >
            {participant.nickname}
          </a>
          {participant.role === 'HOST' ? (
            <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-orange-200">
              Host
            </span>
          ) : null}
        </div>
        <p className={`mt-1 text-xs ${connected ? 'text-emerald-300' : 'text-slate-500'}`}>
          <span
            className={`mr-1.5 inline-block size-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`}
          />
          {connected ? 'Online' : 'Disconnected'}
        </p>
      </div>
    </li>
  )
}

export function RoomPage({ roomId }: RoomPageProps) {
  const navigate = useNavigate()
  const profile = useIdentityStore((state) => state.profile)
  const sessionId = useIdentityStore((state) => state.sessionId)
  const hostedRoomId = useIdentityStore((state) => state.hostedRoomId)
  const setHostedRoomId = useIdentityStore((state) => state.setHostedRoomId)
  const room = useRoomStore((state) => state.room)
  const phase = useConnectionStore((state) => state.phase)
  const connectionMessage = useConnectionStore((state) => state.message)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const mode = hostedRoomId === roomId ? 'HOST' : 'GUEST'
  const inviteUrl = useMemo(() => (isRoomId(roomId) ? createRoomInviteUrl(roomId) : ''), [roomId])

  useEffect(() => {
    if (!profile || !isRoomId(roomId)) return

    return acquireRoomSession({ mode, roomId, participantId: sessionId, profile })
  }, [mode, profile, roomId, sessionId])

  const leaveRoom = () => {
    leaveActiveRoom()
    if (mode === 'HOST') setHostedRoomId(null)
    void navigate({ to: '/' })
  }

  if (!isRoomId(roomId)) {
    return (
      <RoomShell>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Invalid room</p>
          <h1 className="mt-3 text-3xl font-black text-white">This invite link is not valid.</h1>
          <button
            type="button"
            onClick={leaveRoom}
            className="mt-6 text-sm font-bold text-cyan-300"
          >
            Return home
          </button>
        </div>
      </RoomShell>
    )
  }

  if (!profile) {
    return (
      <RoomShell>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Join room</p>
        <h1 className="mt-2 text-3xl font-black text-white">Connect your Steam profile</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The host will add you only after your public profile is loaded and confirmed.
        </p>
        <div className="my-5 h-px bg-white/10" />
        <SteamProfileForm onConfirmed={() => undefined} confirmLabel="Join lobby" />
      </RoomShell>
    )
  }

  if (!room) {
    const terminal = phase === 'ERROR' || phase === 'REJECTED' || phase === 'HOST_UNAVAILABLE'
    return (
      <RoomShell>
        <div className="text-center">
          <span className="mx-auto block size-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            {mode === 'HOST' ? 'Creating room' : 'Joining room'}
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">{phaseLabels[phase]}</h1>
          {connectionMessage ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">{connectionMessage}</p>
          ) : null}
          {terminal ? (
            <button
              type="button"
              onClick={leaveRoom}
              className="mt-6 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/5"
            >
              Return home
            </button>
          ) : null}
        </div>
      </RoomShell>
    )
  }

  const connectedCount = room.participants.filter((participant) => {
    if (participant.role === 'HOST' && mode === 'GUEST' && phase !== 'CONNECTED') return false
    return participant.status === 'CONNECTED'
  }).length
  const hostAvailable = mode === 'HOST' || phase === 'CONNECTED'

  return (
    <main className="relative isolate min-h-dvh bg-[#06080c] px-4 py-6 text-white sm:px-6 lg:py-10">
      <img src={heroBackground} alt="" className="fixed inset-0 -z-30 size-full object-cover" />
      <div className="fixed inset-0 -z-20 bg-[#05070b]/80 backdrop-blur-[2px]" />

      <section className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#090c12]/88 shadow-2xl shadow-black/70 backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
        <div className="p-5 sm:p-7 lg:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                {phaseLabels[phase]}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Lobby</h1>
              <p className="mt-2 break-all font-mono text-xs text-slate-500">{room.id}</p>
            </div>
            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-xl border border-white/12 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Leave room
            </button>
          </div>

          {mode === 'HOST' ? (
            <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
              <label
                htmlFor="invite-url"
                className="text-xs font-bold uppercase tracking-wider text-cyan-200"
              >
                Invite friends
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="invite-url"
                  readOnly
                  value={inviteUrl}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-slate-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCopyError(false)
                    void navigator.clipboard
                      .writeText(inviteUrl)
                      .then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2_000)
                      })
                      .catch(() => setCopyError(true))
                  }}
                  className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                >
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              {copyError ? (
                <p role="alert" className="mt-2 text-xs text-red-200">
                  Copy failed. Select the invite link and copy it manually.
                </p>
              ) : null}
            </div>
          ) : null}

          {connectionMessage && phase !== 'CONNECTED' ? (
            <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
              {connectionMessage}
            </p>
          ) : null}

          <div className="mt-7 flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Players
              </p>
              <h2 className="mt-1 text-xl font-bold">Room participants</h2>
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-bold text-white">{connectedCount}</span> online
            </p>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                hostAvailable={hostAvailable}
              />
            ))}
          </ul>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            The host keeps the room state. Closing the host tab makes this room temporarily
            unavailable. Some networks may require TURN, which is not configured yet.
          </p>
        </div>
      </section>
    </main>
  )
}

function RoomShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-[#06080c] p-4 text-white">
      <img src={heroBackground} alt="" className="fixed inset-0 -z-30 size-full object-cover" />
      <div className="fixed inset-0 -z-20 bg-black/45" />
      <section className="w-full max-w-lg rounded-[1.75rem] border border-white/15 bg-[#090c12]/88 p-6 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-8">
        {children}
      </section>
    </main>
  )
}
