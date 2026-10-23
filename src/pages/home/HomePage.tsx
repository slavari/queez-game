import { useState } from 'react'

import heroBackground from '@/assets/game-world-hero.jpg'

const steps = ['Suggest', 'Vote', 'Play']

function LobbyStartPanel() {
  const [notice, setNotice] = useState<string | null>(null)

  const showComingSoon = (action: 'create' | 'join') => {
    setNotice(
      action === 'create'
        ? 'Lobby creation is coming in the next development stage.'
        : 'Joining a lobby is coming in the next development stage.',
    )
  }

  return (
    <section className="relative w-full max-w-[31rem] overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#090c12]/78 p-6 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-8 lg:p-9">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
      <div className="pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-orange-500/12 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/7 font-black tracking-[-0.08em] ring-1 ring-white/15">
            GP
            <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
          </span>
          <div>
            <p className="font-bold tracking-tight text-white">Game Pick</p>
            <p className="text-xs text-slate-400">Choose together. Play sooner.</p>
          </div>
        </div>

        <div className="my-7 h-px bg-white/10" />

        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
          One group. One decision.
        </p>
        <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl">
          Pick the game everyone wants to play.
        </h1>
        <p className="mt-5 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
          Collect everyone’s game suggestions, vote without revealing individual choices, and find
          the best match for the whole group.
        </p>

        <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="How Game Pick works">
          {steps.map((step, index) => (
            <li
              key={step}
              className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5 text-center"
            >
              <span className="mr-1.5 font-mono text-[0.65rem] text-cyan-300">0{index + 1}</span>
              <span className="text-xs font-semibold text-slate-200">{step}</span>
            </li>
          ))}
        </ol>

        <div className="my-7 h-px bg-white/10" />

        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Get started</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Bring everyone into one lobby
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create a room and share the link, or join with an invitation from a friend.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => showComingSoon('create')}
            className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-4 text-left font-bold text-white shadow-lg shadow-red-950/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 active:translate-y-0"
          >
            <span>Create a lobby</span>
            <span className="grid size-8 place-items-center rounded-lg bg-black/15 text-xl transition-transform group-hover:rotate-90">
              +
            </span>
          </button>

          <button
            type="button"
            onClick={() => showComingSoon('join')}
            className="group flex w-full items-center justify-between rounded-xl border border-cyan-300/30 bg-cyan-300/[0.06] px-5 py-4 text-left font-bold text-cyan-50 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 active:translate-y-0"
          >
            <span>Join a lobby</span>
            <span className="text-xl text-cyan-300 transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        <div className="mt-4 min-h-11" aria-live="polite">
          {notice ? (
            <p className="rounded-lg border border-amber-300/15 bg-amber-300/8 px-3.5 py-2.5 text-xs leading-5 text-amber-100">
              {notice}
            </p>
          ) : (
            <p className="px-1 text-xs leading-5 text-slate-500">
              Lobby creation and live sync are currently in development.
            </p>
          )}
        </div>
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

      <div className="mx-auto flex min-h-dvh max-w-[1440px] items-center justify-end px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <LobbyStartPanel />
      </div>
    </main>
  )
}
