# Keystead

Local-first desktop password manager (KeePass-style). Tauri 2 + React 19 + TypeScript + Vite, pnpm. No cloud sync for now.

## How we work (learning project)

- The owner is learning React, TypeScript, Tailwind, testing, Rust and GitHub through this project.
- Mode: Claude gives the task statement and hints, the owner writes the code, Claude reviews. Do not write app code for the owner unless asked. Tooling setup (phase 0) may be given as explained commands/configs.
- Explain things to the owner in Spanish. Code, identifiers, comments, commits, branch names and PRs are in English.
- Small steps, one concept at a time; end each step with a few review questions.

## Conventions

- Conventional Commits (`feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`, `ci`), imperative mood.
- One change per branch (`feat/...`, `fix/...`, `chore/...`), merged through a GitHub Pull Request after review.

## Security architecture (target)

- The master key lives only in Rust memory (zeroized on lock) and never crosses IPC to the webview.
- KDF: Argon2id. Encryption: XChaCha20-Poly1305 (RustCrypto crates). No custom crypto.
- Vault file: authenticated header (format version, KDF params, salt, nonce) + ciphertext. Atomic writes.

## Roadmap

0. Scaffolding and tooling: typecheck, ESLint + Prettier, Tailwind + shadcn/ui, Vitest + Testing Library ← current
1. Password generator (TDD)
2. UI with fake data: unlock, entry list, search, create/edit (Zustand, React Hook Form + Zod)
3. Rust crypto core: create/open/save vault, with `cargo test`
4. Wire UI to Rust: Tauri commands, typed errors, `mockIPC` in tests
5. Auto-lock, clipboard clearing, strength meter
6. Polish and packaging: dark mode, shortcuts, `.msi`, GitHub Actions CI

## Commands

- `pnpm tauri dev` — run the app
- `pnpm build` — type-check and build the frontend
