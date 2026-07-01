# Orbiter — Nx monorepo → standalone React/Next.js repos

This documents the migration of the Orbiter frontend off the `orbiter-nx` Nx monorepo into
standalone, framework-clean repositories. `orbiter-nx` remains intact as the **port source**.

## Target architecture

```
E:\project\own\orbiter\
  orbiter-nx          # ORIGINAL Nx monorepo — untouched port source (do not edit from the new repos)
  orbiter-nx-lib      # shared library (this repo): UI + auth/login + data-access + i18n + tokens
  orbiter-nx-school   # Next.js 16 App Router app — the School product, consumes orbiter-nx-lib
  …                   # future product apps (crm, carizma, jira, orbiter marketing) follow the same pattern
```

- **`orbiter-nx-lib`** ships TypeScript + CSS-Module source; consumers compile it via Next's
  `transpilePackages`. Subpath exports (`/ui`, `/auth`, `/data-access`, `/types`, `/i18n`, `/utils`,
  `/styles/tokens.css`); internal `#`-aliases for cross-module imports.
- **`orbiter-nx-school`** links the lib with `file:../orbiter-nx-lib` and dedupes the state singletons
  (`react-redux`, `@reduxjs/toolkit`, `i18next`, `react-i18next`) via webpack `resolve.alias`.

## Conventions (enforced by lint)

- **Styling = CSS Modules.** Co-located `*.module.css`; variants via `data-*` selectors; hover/focus
  via CSS pseudo-classes; dynamics via CSS custom properties; **design tokens only, no raw hex**
  (stylelint `color-no-hex`). The entire lib UI and all school feature components follow this.
- **No dead code** (`@typescript-eslint/no-unused-vars: error`, `knip`); files target < 300 lines.

## Design tokens

Defined in [`src/styles/_tokens.scss`](src/styles/_tokens.scss) (source of truth) and mirrored to
[`src/styles/orbiter-design-tokens.css`](src/styles/orbiter-design-tokens.css) (the runtime CSS,
exported as `orbiter-nx-lib/styles/tokens.css`). Light + dark + dark-blue themes via `[data-theme]`.

Tokens added during the migration (so converted components reference tokens, not hex):
`--text-on-accent`, `--teal-light`, `--teal-lighter`, `--gold-pressed`,
`--navy-900` / `--navy-950` / `--navy-1000`, `--code-bg` / `--code-fg` / `--code-accent`.

## Key framework adaptations (Vite/Nx → Next.js)

- Env: `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`.
- `'use client'` boundaries on the interactive barrels (`/ui`, `/auth`, `/data-access`, `/i18n`).
- Routing: react-router → `next/navigation`; lib auth pages use a framework-agnostic `useNavigate`
  backed by a host-provided `NavigationProvider` (the app wires it to the Next router).
- App build resolves the lib's NodeNext `.js`→`.ts` imports via webpack `extensionAlias`.

## Status

- **Both repos build green** (typecheck + lint + stylelint); `orbiter-nx-school` passes `next build`
  with **0 ESLint errors** and **0 `max-lines` violations**.
- `orbiter-nx-school`: all 20 routes, auth → org → dashboard flow, i18n working.
- CSS-Modules conversion: the **entire lib UI (27 components)** and **all school feature components**
  are converted and fully tokenized.
- **Monster-file decomposition: done.** All 16 oversized views (worst was 1484 lines) are split into
  focused co-located modules (one file per leaf component; `types.ts` / `constants.ts` / `helpers.ts` /
  `use*.ts` for shared types, data tables, pure fns, and stateful hooks). Every file is under the
  500-line `max-lines` ceiling (enforced in [`eslint.config.mjs`](../orbiter-nx-school/eslint.config.mjs),
  counting sans blank/comment lines, mirroring the orbiter-nx config). The decomposition is mechanical —
  code moved verbatim, public APIs preserved, behavior unchanged (typecheck + build green throughout).

  > Decomposition pattern (reference): `feature/lib/components/MentorReviewInboxView/` — main `.tsx`
  > is the orchestrator; sub-components, types, constants, helpers each live in their own file, all
  > importing the same co-located `*.module.css`.

## Lint guardrails (orbiter-nx-school)

Ported from orbiter-nx and enforced on `feature/**` + `app/**`: `max-lines` **error @ 500** (hard
ceiling), `@typescript-eslint/no-unused-vars` **error** (delete dead code immediately), the static
inline-style ban (warn → CSS Modules), `max-lines-per-function` warn. The React-Compiler advisories
from `eslint-plugin-react-hooks` v6 (`set-state-in-effect`, `refs`, `static-components`) are
**downgraded to warnings** — they flag legacy patterns in the ported Vite/react-router code that ran
fine under React 19 without the compiler; fixing them is a behavioral follow-up, tracked separately
from the mechanical size decomposition.

## Remaining / follow-ups

- React-Compiler advisory warnings (`set-state-in-effect` ×30, `refs` ×11, `static-components` ×1):
  refactor the flagged effects/refs when convenient (behavioral, not mechanical).
- Three files are a hair over 500 *raw* lines but pass the enforced (sans-blank/comment) rule —
  optionally split `MonthGrid` (552), `BlockCreatorModal` (511), `ImageGalleryBlock` (505).
- Per-request Redux store factory (SSR hardening; the current singleton is fine for the client-rendered app).
- Publish the lib to a registry (currently local-linked) when its API stabilizes.
- Migrate the other product apps (crm, carizma, jira, orbiter marketing) using the same pattern.
