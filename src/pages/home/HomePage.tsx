import { useState } from 'react'

import heroBackground from '@/assets/game-world-hero.jpg'

const benefits = [
  ['01', 'Предложите игры'],
  ['02', 'Проголосуйте'],
  ['03', 'Запускайте победителя'],
]

export function HomePage() {
  const [notice, setNotice] = useState<string | null>(null)

  const showComingSoon = (action: 'create' | 'join') => {
    setNotice(
      action === 'create'
        ? 'Создание лобби появится на следующем этапе разработки.'
        : 'Подключение к лобби появится на следующем этапе разработки.',
    )
  }

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#07090d] text-white">
      <img
        src={heroBackground}
        alt=""
        className="absolute inset-0 -z-30 size-full object-cover object-[68%_center] opacity-70"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,7,11,0.98)_0%,rgba(5,7,11,0.9)_38%,rgba(5,7,11,0.52)_70%,rgba(5,7,11,0.36)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,7,11,0.3)_0%,rgba(5,7,11,0.08)_48%,rgba(5,7,11,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />

      <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-[#121720] font-black tracking-[-0.08em] shadow-xl shadow-black/30 ring-1 ring-white/15">
              <span className="relative z-10">GP</span>
              <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight">Game Pick</p>
              <p className="text-xs text-slate-400">выбирайте игру вместе</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-2 text-xs text-slate-300 backdrop-blur sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Без регистрации
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.65fr)] lg:gap-16 lg:py-20 xl:gap-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-500/8 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              <span className="size-1.5 rounded-full bg-orange-400" />
              Решаем главный вопрос вечера
            </div>

            <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
              Во что играем
              <br />{' '}
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-300 bg-clip-text text-transparent">
                сегодня?
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Game Pick помогает друзьям собрать любимые игры в одном месте, провести анонимное
              голосование и выбрать вариант, который устраивает всю компанию.
            </p>

            <ol className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {benefits.map(([number, label]) => (
                <li
                  key={number}
                  className="flex items-center gap-3 border-l border-white/15 bg-black/15 px-3 py-2.5 backdrop-blur-sm"
                >
                  <span className="font-mono text-xs text-cyan-300">{number}</span>
                  <span className="text-sm font-medium text-slate-200">{label}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0b0e14]/82 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-cyan-400" />
            <div className="absolute -right-20 -top-24 size-56 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Начать выбор
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Соберите всех
                <br />в одном лобби
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Создайте комнату и отправьте ссылку друзьям — или войдите по приглашению.
              </p>

              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  onClick={() => showComingSoon('create')}
                  className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-4 text-left font-bold shadow-lg shadow-red-950/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 active:translate-y-0"
                >
                  <span>Создать лобби</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-black/15 text-xl transition-transform group-hover:rotate-90">
                    +
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => showComingSoon('join')}
                  className="group flex w-full items-center justify-between rounded-xl border border-cyan-300/25 bg-cyan-300/[0.055] px-5 py-4 text-left font-bold text-cyan-50 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 active:translate-y-0"
                >
                  <span>Присоединиться к лобби</span>
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
                    Лобби и синхронизация находятся в разработке.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Одна ссылка · все предложения · честный результат</span>
          <div className="flex items-center gap-2" aria-label="Цветовые акценты игровых жанров">
            <span className="size-1.5 rounded-full bg-orange-500" />
            <span className="size-1.5 rounded-full bg-red-500" />
            <span className="size-1.5 rounded-full bg-cyan-400" />
            <span className="size-1.5 rounded-full bg-amber-300" />
          </div>
        </footer>
      </div>
    </main>
  )
}
