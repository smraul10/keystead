# Keystead

Local-first desktop password manager (KeePass-style). Tauri 2 + React 19 + TypeScript + Vite, pnpm. No cloud sync for now.

## How we work (learning project)

- The owner is learning React, TypeScript, Tailwind, testing, Rust and GitHub through this project.
- Mode: Claude gives the task statement and hints, the owner writes the code, Claude reviews. Do not write app code for the owner unless asked. Tooling setup (phase 0) may be given as explained commands/configs.
- For every commit and PR, Claude proposes the exact git commands, the commit message (with a short explanation of the chosen type) and the PR title and description. The owner runs them.
- Claude keeps `CLAUDE.md` up to date directly (structure, decisions, roadmap); the owner reviews and commits it.
- Explain things to the owner in Spanish. Code, identifiers, comments, commits, branch names and PRs are in English.
- Small steps, one concept at a time; end each step with a few review questions.

## Conventions

- Conventional Commits (`feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`, `ci`), imperative mood.
- One change per branch (`feat/...`, `fix/...`, `chore/...`), merged through a GitHub Pull Request after review.
- Tailwind classes are sorted automatically by `prettier-plugin-tailwindcss` (run `pnpm format`).
- No external network requests from the UI: fonts and assets are bundled with the app (Fontsource, no CDNs or Google Fonts). Check a dependency's license before adding it (`pnpm licenses list`).
- UI components are written by hand with Tailwind (no shadcn/ui or component libraries). Prefer native HTML elements (`button`, `input`, `dialog`) for built-in accessibility.
- Icons: Lucide (`lucide-react`, ISC). Import each icon by name (only those are bundled), size it with Tailwind (`size-4`) and let it inherit the text color. Lucide adds `aria-hidden` when the icon has no `aria-label` or `title`, so icons next to text need nothing else; an icon-only button needs its own `aria-label`.
- UI rules: never remove the focus indicator (global `:focus-visible` ring in `index.css`); every animation uses `motion-safe:` / `motion-reduce:`; space with `gap` and `padding` rather than margins; write Tailwind class names in full (never build them from pieces); icon-only content is `aria-hidden` and every control has an accessible name.
- TypeScript runs in strict mode plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Avoid `!` (non-null assertion) and `as` casts: check the value and let TypeScript narrow it. For states that cannot happen, throw a clear error instead of asserting.
- Data from outside (localStorage, files, IPC) is read as `unknown` and validated before use. Only preferences go to localStorage, never secrets.

## Project structure

- `src/app/`: the app shell (`App` and the sidebar navigation between sections).
- `src/components/`: shared UI components (`Button`, `Checkbox`).
- `src/hooks/`: shared hooks (`useLocalStorage`).
- `src/features/<name>/`: one folder per feature (e.g. `generator`) with its main component, its logic and their tests. UI pieces used only by that feature go in its `components/` folder.
- Each feature exposes its public API through `index.ts`. The rest of the app imports it only from there (`@/features/generator`); ESLint blocks deep imports like `@/features/generator/options`.
- `@/` is an alias for `src/`: use it to import from another folder (`@/components/Button`). Inside a feature, use relative imports (`./options`, `../styles`).
- Tests sit next to the file they test (`options.ts` → `options.test.ts`).

## Security architecture (target)

- The master key lives only in Rust memory (zeroized on lock) and never crosses IPC to the webview.
- KDF: Argon2id. Encryption: XChaCha20-Poly1305 (RustCrypto crates). No custom crypto.
- Vault file: authenticated header (format version, KDF params, salt, nonce) + ciphertext. Atomic writes.
- Strict CSP in `tauri.conf.json`: only bundled resources (`'self'`), and the UI can only talk to Rust (`connect-src ipc: http://ipc.localhost`). Never loosen it for convenience. On desktop, `pnpm tauri dev` does not apply the CSP: test it with `pnpm tauri build --debug --no-bundle`.
- Least privilege: no unused plugins, commands or capability permissions.

## Product decisions

- Layout: three columns, like Bitwarden and 1Password: sidebar, item list (search, "+ New") and item details (copy buttons, Edit).
- Sidebar: All items, Favorites, Trash and Generator, with Settings and Lock at the bottom. Each one is added when it works (no dead buttons).
- Navigation is a state in `App`, with no router: a desktop app has no URLs.
- Only login items for now. An `Item` has `id`, `title`, `username`, `password`, `url`, `notes`, `favorite`, `createdAt` and `updatedAt`. Text fields are always strings (`''` when empty, never optional) and dates are ISO 8601 UTC strings (JSON-friendly and sortable as text). The word "item" is used both in the UI and in the code.
- Item icons: the title's initial on a color derived from the title (no network). Later (phase 4), an optional "Download icon" button where Rust fetches the site's favicon on demand and stores it encrypted in the vault, like KeePassXC. Never ask a third-party icon server for logos (it would learn which sites the user has accounts on).
- Search filters the list as you type: it looks in the title, username, URL and notes (never in passwords), ignores case and accents, and every word must match.
- Lists show favorites first (marked with a star), then the rest. Each group is sorted by title as a person would sort it (`Intl.Collator`): case and accents are ignored and numbers sort naturally (`Server 2` before `Server 10`).
- Password generator: random characters only for now (passphrases may come later, e.g. for the master password). One reusable `PasswordGenerator` component, used in two places: a standalone "Generator" section (copy the password) and the item form, where a dice button (`Dices` icon) next to the password field opens it in a dialog with a "Use password" button (like Bitwarden and KeePassXC).
- The password regenerates live whenever an option changes; the "Regenerate" button gives a new one with the same options.
- Generator options: lowercase, uppercase, digits, symbols (each toggleable), exclude ambiguous characters (`0 O 1 l I`), require at least one character of each enabled type, adjustable length (default 20, range 8–128).
- The generated password is shown color-coded by character type (letters default, digits and symbols in their own colors), like Bitwarden and 1Password, to tell apart look-alike characters.
- Below the password: "Regenerate" (`RefreshCw`, spins on click) and "Copy" (`Copy`, then `Check`) buttons with icon + text, in two full-width columns (Copy shows "Copied" for 2 s). The password box takes the full width and grows when a long password wraps.
- Generator options live in a collapsible panel, closed by default; the length (slider + number) stays visible outside it. The panel state and the chosen options are remembered between sessions (never the password itself).
- Strength indicator: an icon + the level word, colored by level (no bar). The entropy in bits appears as a tooltip. Levels like KeePassXC: Poor < 40 bits, Weak < 75, Good < 100, Excellent ≥ 100.
- Fonts (OFL-1.1, variable, self-hosted via Fontsource): Inter for the whole UI (`--font-sans`, with optical sizes via `opsz.css`) and JetBrains Mono for passwords (`--font-mono`), chosen because it tells apart look-alike characters (`0 O`, `1 l I`). Ligatures are disabled for any mono font, so characters like `!=` or `->` are never merged in a password.
- Theme: light for now. A theme setting (light / dark / system) comes later (phase 6), using Tailwind `dark:` variants.

## Roadmap

0. Scaffolding and tooling: typecheck, ESLint + Prettier, Vitest + Testing Library, CI, Tailwind CSS ✅
1. Password generator (TDD) ✅
   - Tauri setup before phase 2: remember window size/position (`tauri-plugin-window-state`), strict CSP ✅
2. UI with fake data: unlock, item list, search, create/edit, favorites, trash (Zustand, React Hook Form + Zod) ← current
3. Rust crypto core: create/open/save vault, with `cargo test`
4. Wire UI to Rust: Tauri commands, typed errors, `mockIPC` in tests, on-demand favicon download
5. Auto-lock, clipboard clearing, strength meter
6. Polish and packaging: dark mode, shortcuts, `.msi`, third-party licenses notice

## Commands

- `pnpm tauri dev` — run the app
- `pnpm build` — type-check and build the frontend
