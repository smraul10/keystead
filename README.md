# Keystead

A local-first desktop password manager, inspired by KeePass. Your passwords
stay encrypted on your own computer: no cloud.

> 🚧 Work in progress. This is a learning project and it is not ready to store
> real passwords yet.

## Features

- **Password generator**
  - Cryptographically secure randomness (`crypto.getRandomValues`), no modulo
    bias, Fisher-Yates shuffle
  - Length 8–128, character types, avoid ambiguous characters, at least one
    character of each type
  - Strength indicator (entropy in bits), color-coded characters, copy button
  - Remembers your options

Planned: encrypted vault (Argon2id + XChaCha20-Poly1305), entry list and
search, auto-lock and clipboard clearing.

## Security principles

- **Local-first:** no network requests and no cloud. A strict Content Security
  Policy only lets the UI talk to the Rust core.
- **The master key will never reach the UI:** it will live only in Rust memory.
- **No custom crypto:** only audited cryptography libraries.
- **Least privilege:** no unused plugins or permissions.

## Tech stack

Tauri 2 · React 19 · TypeScript · Vite · Tailwind CSS 4 · Vitest + Testing
Library · Rust

## Getting started

Requirements: Node.js 24, pnpm 12, Rust (stable) and the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
pnpm install
pnpm tauri dev
```

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm tauri dev`   | Run the desktop app         |
| `pnpm test`        | Run the tests               |
| `pnpm test:watch`  | Run the tests in watch mode |
| `pnpm lint`        | Lint with ESLint            |
| `pnpm typecheck`   | Type-check with TypeScript  |
| `pnpm format`      | Format with Prettier        |
| `pnpm tauri build` | Build the installer         |

Checks run automatically before every commit (Lefthook) and on every pull
request (GitHub Actions).

## Project structure

```
src/
  components/   shared UI (Button, Checkbox)
  hooks/        shared hooks (useLocalStorage)
  features/     one folder per feature (generator, ...)
src-tauri/      Rust side: the window, and later the encrypted vault
```

## License

No license yet: all rights reserved.
