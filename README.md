# Game Pick

Game Pick — browser-first приложение, которое в будущем поможет компании друзей совместно
выбрать игру: собрать предложения, провести скрытое голосование и показать агрегированный
рейтинг. Сейчас репозиторий содержит только техническую основу и стартовую страницу; комнаты,
Steam-интеграция, P2P-соединения и голосование намеренно не реализованы.

## Стек

- React и TypeScript в strict mode;
- Vite и Tailwind CSS;
- TanStack Router с hash-history для статического хостинга;
- Zustand как выбранный инструмент будущего клиентского состояния;
- Vitest и Testing Library;
- ESLint и Prettier.

PeerJS и библиотеки для Steam не установлены: они появятся только вместе с реальной
функциональностью.

## Требования

- Node.js 22 или новее;
- npm 10 или новее.

## Локальный запуск

```bash
npm install
npm run dev
```

Vite выведет локальный URL в терминале. Настраивать backend или базу данных не нужно.

## Команды

```bash
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run format:check  # проверка Prettier
npm run test          # тесты один раз
npm run test:watch    # тесты в watch-режиме
npm run build         # production build в dist/
npm run preview       # локальный просмотр production build
```

## GitHub Pages

Проект не знает имя будущего репозитория заранее. Корневой путь задаётся переменной
`VITE_BASE_PATH`:

```bash
VITE_BASE_PATH=/repository-name/ npm run build
```

Для пользовательского сайта (`username.github.io`) или custom domain используйте `/`.
Маршрутизатор применяет URL после `#`, поэтому открытие вложенного маршрута не требует
серверных rewrite-правил.

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) при публикации из ветки
`main` автоматически использует имя репозитория. Перед первым запуском в GitHub откройте
**Settings → Pages → Build and deployment** и выберите **GitHub Actions**. Если сайт размещается
на custom domain или является корневым Pages-сайтом, создайте repository variable
`VITE_BASE_PATH` со значением `/` в **Settings → Secrets and variables → Actions → Variables**.
Фактический deploy этим репозиторием пока не выполнялся.

## Документация

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — продуктовые требования и открытые вопросы;
- [ARCHITECTURE.md](ARCHITECTURE.md) — границы модулей, P2P-модель и риски;
- [AGENTS.md](AGENTS.md) — правила дальнейшей разработки.
