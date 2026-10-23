const foundationItems = [
  'Статический frontend',
  'P2P-ready архитектура',
  'Без регистрации',
  'Адаптивная тёмная тема',
]

export function HomePage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(124,58,237,0.2),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(34,211,238,0.1),transparent_32%)]" />

      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-white/8 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-violet-500 text-lg font-black text-white shadow-lg shadow-violet-950/40">
              G
            </span>
            <div>
              <p className="font-semibold tracking-tight text-white">Game Pick</p>
              <p className="text-xs text-slate-500">collective game chooser</p>
            </div>
          </div>
          <span className="rounded-full border border-violet-400/20 bg-violet-400/8 px-3 py-1.5 text-xs font-medium text-violet-200">
            Foundation · v0.1
          </span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">
              Выбирайте вместе
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Одна компания.
              <br />
              Одна игра.
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
                Без споров.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Будущий сервис поможет друзьям собрать предложения, провести анонимное голосование и
              выбрать игру с учётом общего интереса.
            </p>

            <div className="mt-9 flex flex-wrap gap-2.5" aria-label="Возможности основы проекта">
              {foundationItems.map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2 text-sm text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="relative rounded-3xl border border-white/10 bg-[#10131e]/85 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Статус проекта
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">Техническая основа</h2>
              </div>
              <span className="flex items-center gap-2 text-sm text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                Готова
              </span>
            </div>

            <div className="my-6 h-px bg-white/8" />

            <ol className="space-y-4">
              {[
                ['01', 'Создание комнаты', 'следующий этап'],
                ['02', 'Сбор предложений', 'запланировано'],
                ['03', 'Анонимное голосование', 'запланировано'],
              ].map(([number, label, status]) => (
                <li
                  key={number}
                  className="flex items-center gap-4 rounded-2xl bg-white/[0.025] p-4"
                >
                  <span className="font-mono text-xs text-violet-300">{number}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-slate-200">{label}</span>
                  <span className="text-right text-xs text-slate-600">{status}</span>
                </li>
              ))}
            </ol>

            <p className="mt-6 rounded-xl border border-amber-300/10 bg-amber-300/5 px-4 py-3 text-sm leading-6 text-amber-100/70">
              Комнаты и голосование ещё не реализованы. Это стартовый интерфейс проекта.
            </p>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/8 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Browser-first · no accounts · no database</span>
          <span>React + TypeScript + Vite</span>
        </footer>
      </div>
    </main>
  )
}
