# Keystead

Local-first desktop password manager (KeePass-style). Tauri 2 + React 19 + TypeScript + Vite, pnpm. No cloud sync for now.

## How we work (learning project)

- The owner is learning React, TypeScript, Tailwind, testing, Rust and GitHub through this project.
- Mode: Claude gives the task statement and hints, the owner writes the code, Claude reviews. Do not write app code for the owner unless asked. Tooling setup (phase 0) may be given as explained commands/configs.
- For every commit and PR, Claude proposes the exact git commands, the commit message (with a short explanation of the chosen type) and the PR title and description. The owner runs them.
- Explain things to the owner in Spanish. Code, identifiers, comments, commits, branch names and PRs are in English.
- Small steps, one concept at a time; end each step with a few review questions.

## Conventions

- Conventional Commits (`feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`, `ci`), imperative mood.
- One change per branch (`feat/...`, `fix/...`, `chore/...`), merged through a GitHub Pull Request after review.
- UI components are written by hand with Tailwind (no shadcn/ui or component libraries). Prefer native HTML elements (`button`, `input`, `dialog`) for built-in accessibility.

## Security architecture (target)

- The master key lives only in Rust memory (zeroized on lock) and never crosses IPC to the webview.
- KDF: Argon2id. Encryption: XChaCha20-Poly1305 (RustCrypto crates). No custom crypto.
- Vault file: authenticated header (format version, KDF params, salt, nonce) + ciphertext. Atomic writes.

## Product decisions

- Password generator: random characters only for now (passphrases may come later, e.g. for the master password). One reusable `PasswordGenerator` component, used in two places: a standalone "Generator" section (copy the password) and the entry form, where a 🎲 button next to the password field opens it in a dialog with a "Use password" button (like Bitwarden and KeePassXC).
- The password regenerates live whenever an option changes; a small ↻ "Regenerate password" button gives a new one with the same options.
- Generator options: lowercase, uppercase, digits, symbols (each toggleable), exclude ambiguous characters (`0 O 1 l I`), require at least one character of each enabled type, adjustable length (default 20, range 8–128).

- The generated password is shown color-coded by character type (letters default, digits and symbols in their own colors), like Bitwarden and 1Password, to tell apart look-alike characters.
- Theme: light for now. A theme setting (light / dark / system) comes later (phase 6), using Tailwind `dark:` variants.

## Roadmap

0. Scaffolding and tooling: typecheck, ESLint + Prettier, Vitest + Testing Library, CI, Tailwind CSS ✅
1. Password generator (TDD) ← current
2. UI with fake data: unlock, entry list, search, create/edit (Zustand, React Hook Form + Zod)
3. Rust crypto core: create/open/save vault, with `cargo test`
4. Wire UI to Rust: Tauri commands, typed errors, `mockIPC` in tests
5. Auto-lock, clipboard clearing, strength meter
6. Polish and packaging: dark mode, shortcuts, `.msi`, GitHub Actions CI

## Commands

- `pnpm tauri dev` — run the app
- `pnpm build` — type-check and build the frontend
