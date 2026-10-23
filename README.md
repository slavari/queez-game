# Game Pick

Game Pick — статическое browser-first приложение для компании друзей. Сейчас реализованы
подключение публичного Steam-профиля, создание P2P-комнаты, вход по ссылке и синхронизация списка
участников. Игры и голосование относятся к следующему этапу и пока не реализованы.

## Стек

- React 19, TypeScript strict, Vite и Tailwind CSS 4;
- TanStack Router с hash-history для GitHub Pages;
- Zustand для раздельного состояния identity, соединения и комнаты;
- PeerJS поверх WebRTC DataChannel;
- stateless Cloudflare Worker для чтения Steam Community XML;
- Vitest, Testing Library, ESLint и Prettier.

## Требования

- Node.js 22 или новее;
- pnpm 11 (точная версия указана в `packageManager`).

## Локальный запуск

Установите зависимости:

```bash
corepack enable
pnpm install
```

В одном терминале запустите Steam Worker:

```bash
pnpm worker:dev
```

Создайте `.env.local`:

```dotenv
VITE_BASE_PATH=/
VITE_STEAM_PROFILE_API_URL=http://localhost:8787
```

Во втором терминале запустите frontend:

```bash
pnpm dev
```

Worker не хранит профили и не требует Steam API key. Он принимает только валидированный vanity
name или Steam ID, сам строит URL `steamcommunity.com`, ограничивает ответ и время запроса и
возвращает четыре нормализованных публичных поля. Прямой запрос из браузера не используется из-за
CORS Steam Community.

## Cloudflare Worker

Конфигурация находится в `workers/steam-profile/wrangler.jsonc`. Перед публикацией проверьте
`ALLOWED_ORIGINS`: это список origins без путей. Затем авторизуйте Wrangler в своём Cloudflare
аккаунте и выполните:

```bash
pnpm worker:deploy
```

Команда выведет реальный URL Worker. Укажите его без завершающего `/` в
`VITE_STEAM_PROFILE_API_URL`. Не добавляйте в репозиторий API keys или Cloudflare credentials.
Worker не публикуется автоматически workflow GitHub Pages.

## Проверка комнаты в двух сессиях

1. Откройте frontend в браузере A, выберите **Create a lobby**, загрузите публичный Steam-профиль
   и подтвердите его.
2. Дождитесь состояния **Connected**: только после регистрации Peer ID комната считается готовой.
3. Скопируйте invite URL и откройте его в отдельном браузере или приватной сессии B.
4. Загрузите другой Steam-профиль и нажмите **Join lobby**.
5. Убедитесь, что оба клиента показывают хоста и гостя без перезагрузки.
6. Закройте B. После пятисекундного grace period хост должен показать гостя как disconnected.
7. Снова откройте invite в той же сессии B: сохранённый в `sessionStorage` participant ID должен
   восстановить прежнюю запись без дубля.

Использование одного Steam ID двумя активными сессиями отклоняется. Это не подтверждает владение
Steam-аккаунтом: OAuth/OpenID намеренно не входят в текущий этап.

## Команды

```bash
pnpm typecheck      # TypeScript frontend + Worker
pnpm lint           # ESLint
pnpm format:check   # проверка Prettier
pnpm test           # unit/integration tests
pnpm build          # production build в dist/
pnpm preview        # локальный просмотр production build
pnpm worker:dev     # локальный Cloudflare Worker
pnpm worker:deploy  # ручная публикация Worker
```

## GitHub Pages

Production base path задаётся `VITE_BASE_PATH`:

```bash
VITE_BASE_PATH=/queez-game/ VITE_STEAM_PROFILE_API_URL=https://WORKER.example.workers.dev pnpm build
```

Hash-route приглашения имеет вид
`https://slavari.github.io/queez-game/#/room/gp-…`, поэтому прямое открытие не требует rewrite.
Workflow `.github/workflows/deploy.yml` публикует `main` через GitHub Actions. Перед первым deploy:

1. В **Settings → Pages → Build and deployment** выберите **GitHub Actions**.
2. Workflow использует опубликованный Worker проекта по умолчанию. При смене Worker создайте
   Actions variable `VITE_STEAM_PROFILE_API_URL` с новым URL.
3. При custom domain или root Pages site задайте `VITE_BASE_PATH=/`; для project site workflow
   вычисляет path репозитория автоматически.

## Ограничения

- состояние комнаты находится только в памяти браузера хоста;
- при перезагрузке хост повторно занимает тот же Peer ID, но прежний список гостей не сохраняется;
  гости с той же сессией переподключаются и восстанавливают записи;
- при закрытом хосте комната недоступна, миграции роли нет;
- используется публичный PeerJS signaling, а TURN не настроен, поэтому строгие NAT/firewall могут
  помешать соединению;
- Steam Community XML — не гарантированный API: Worker обрабатывает ошибки, но не может обеспечить
  постоянную доступность источника.

Подробности: [PROJECT_SPEC.md](PROJECT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md) и
[AGENTS.md](AGENTS.md).
