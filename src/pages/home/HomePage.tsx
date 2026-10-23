import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import heroBackground from '@/assets/game-world-hero.jpg'
import { useIdentityStore } from '@/features/participants/model/identity-store'
import { createRoomId, parseRoomReference } from '@/features/room/lib/room-id'
import { SteamProfileForm } from '@/features/steam-profile/ui/SteamProfileForm'

const steps = ['Suggest', 'Vote', 'Play']

function LobbyStartPanel() {
  const navigate = useNavigate()
  const setHostedRoomId = useIdentityStore((state) => state.setHostedRoomId)
  const [flow, setFlow] = useState<'CREATE' | 'JOIN' | null>(null)
  const [roomReference, setRoomReference] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)

  const enterRoom = (roomId: string, isHost: boolean) => {
    setHostedRoomId(isHost ? roomId : null)
    void navigate({ to: '/room/$roomId', params: { roomId } })
  }

  return (
    <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[32rem] overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#090c12]/82 shadow-2xl shadow-black/70 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
      <div className="pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-orange-500/12 blur-3xl" />

      <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7 lg:p-8">
        {flow ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setFlow(null)
                setRoomError(null)
              }}
              className="mb-5 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              ← Back
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              {flow === 'CREATE' ? 'Create a room' : 'Join a room'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              Connect your Steam profile
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your public nickname and avatar identify you to friends in this lobby.
            </p>

            {flow === 'JOIN' ? (
              <div className="mt-5">
                <label htmlFor="room-reference" className="text-sm font-semibold text-slate-200">
                  Invite link or room ID
                </label>
                <input
                  id="room-reference"
                  value={roomReference}
                  onChange={(event) => {
                    setRoomReference(event.target.value)
                    setRoomError(null)
                  }}
                  placeholder="Paste #/room/gp-… link"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
                />
                {roomError ? (
                  <p role="alert" className="mt-2 text-sm text-red-200">
                    {roomError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="my-5 h-px bg-white/10" />
            <SteamProfileForm
              confirmLabel={flow === 'CREATE' ? 'Create lobby' : 'Join lobby'}
              onConfirmed={() => {
                if (flow === 'CREATE') {
                  enterRoom(createRoomId(), true)
                  return
                }

                const roomId = parseRoomReference(roomReference)
                if (!roomId) {
                  setRoomError('Enter a valid Game Pick invite link or room ID.')
                  return
                }
                enterRoom(roomId, false)
              }}
            />
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
              One group. One decision.
            </p>
            <h1 className="mt-3 text-3xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.75rem]">
              Pick the game everyone wants to play.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Collect everyone’s game suggestions, vote without revealing individual choices, and
              find the best match for the whole group.
            </p>

            <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="How the app works">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5 text-center"
                >
                  <span className="mr-1.5 font-mono text-[0.65rem] text-cyan-300">
                    0{index + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{step}</span>
                </li>
              ))}
            </ol>

            <div className="my-5 h-px bg-white/10" />

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Get started
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Bring everyone into one lobby
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Create a room and share the link, or join with an invitation from a friend.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setFlow('CREATE')}
                className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-4 text-left font-bold text-white shadow-lg shadow-red-950/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 active:translate-y-0"
              >
                <span>Create a lobby</span>
                <span className="grid size-8 place-items-center rounded-lg bg-black/15 text-xl transition-transform group-hover:rotate-90">
                  +
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFlow('JOIN')}
                className="group flex w-full items-center justify-between rounded-xl border border-cyan-300/30 bg-cyan-300/[0.06] px-5 py-4 text-left font-bold text-cyan-50 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 active:translate-y-0"
              >
                <span>Join a lobby</span>
                <span className="text-xl text-cyan-300 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>

            <p className="mt-4 px-1 text-xs leading-5 text-slate-500">
              Rooms use a direct browser-to-browser connection. No account or database required.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#06080c] text-white">
      <img
        src={heroBackground}
        alt=""
        className="fixed inset-0 -z-30 size-full object-cover object-[55%_center]"
      />
      <div className="fixed inset-0 -z-20 bg-black/20" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_78%_50%,rgba(5,7,11,0.04),rgba(5,7,11,0.2)_42%,rgba(5,7,11,0.72)_100%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />

      <div className="mx-auto flex h-dvh max-w-[1440px] items-center justify-center p-4 sm:p-6">
        <LobbyStartPanel />
      </div>
    </main>
  )
}
