# Development rules

## Scope and architecture

- Follow `PROJECT_SPEC.md` and `ARCHITECTURE.md`; preserve `CONFIRMED`, `PROPOSED`, and `OPEN`
  distinctions.
- Use a feature-based architecture. Add a directory only with the first real implementation that
  needs it; do not scaffold empty services, hooks, stores, interfaces, or components.
- Keep UI, domain/business logic, state, transport/external APIs, and local persistence separated.
- Place only genuinely reusable primitives in `src/shared`; keep app composition in `src/app` and
  route-level UI in `src/pages`.
- Do not change confirmed business behavior, choose open rules, or turn examples into requirements
  without agreement.

## Engineering

- Keep TypeScript strict and do not weaken compiler or lint settings to bypass errors.
- Add tests with behavior. Keep pure domain logic independent from React and network adapters.
- Use path aliases for cross-module imports and relative imports inside a small local module.
- Keep dependencies minimal. Add PeerJS, Steam clients, validators, or infrastructure packages only
  when an implemented use case requires them.
- Keep PeerJS behind the P2P transport/session layer; React components consume stores and session
  controllers rather than calling PeerJS directly.
- Treat the host as the authoritative room-state owner. Validate message version, type, payload,
  size, participant identity, and duplicate Steam profiles at the host boundary.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` before
  handing off changes.

## Platform constraints

- Preserve static GitHub Pages compatibility and the configurable Vite base path.
- Do not add a permanently running application backend or a database without explicit approval.
- Small stateless serverless functions are allowed only for a demonstrated integration need and
  must not store rooms, profiles, or votes.
- Never put secret keys in frontend code, `VITE_*` variables, committed files, or public build
  artifacts.
- Treat peer messages and external API responses as untrusted input.
- Do not implement functionality outside the requested stage or advertise UI-level vote anonymity
  as cryptographic anonymity.
