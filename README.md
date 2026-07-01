# orbiter-nx-lib

Shared Orbiter library — **UI components**, **auth / login services**, **data-access**
(RTK Query + axios + redux store), **i18n** and **design tokens**. Ported from the
`orbiter-nx` monorepo, now framework-agnostic React (no Nx).

Consumed by Next.js apps (e.g. `orbiter-nx-school`). It **ships TypeScript/CSS-Module
source** and is compiled by the consuming app via Next's `transpilePackages`, so there is
no build step during development.

## Entry points

| Import | Contents |
|--------|----------|
| `orbiter-nx-lib/ui` | Presentational components (Button, Card, Modal, Input, …). CSS Modules. |
| `orbiter-nx-lib/auth` | Auth/login services: `useAuth`, `usePermissions`, `ProductProvider`, login/register pages, guards*. |
| `orbiter-nx-lib/data-access` | RTK Query `api`, redux `store`, slices, axios client, endpoint hooks. |
| `orbiter-nx-lib/types` | Shared API/domain TypeScript types. |
| `orbiter-nx-lib/i18n` | i18next config + locales (en/ru/hy). |
| `orbiter-nx-lib/utils` | Generic utilities. |
| `orbiter-nx-lib/styles/tokens.css` | Design-token CSS custom properties (import once, globally). |

\* Routing guards (`RequireAuth`, `RequireOrg`, …) are currently React-Router-based and are
re-implemented per app with Next navigation — see `orbiter-nx-school`.

## Consume from a Next.js app (local link)

```js
// next.config.mjs
const nextConfig = { transpilePackages: ['orbiter-nx-lib'] };
export default nextConfig;
```
```jsonc
// app package.json — local link during development
"dependencies": { "orbiter-nx-lib": "file:../orbiter-nx-lib" }
```
```ts
import { Button } from 'orbiter-nx-lib/ui';
import { useAuth } from 'orbiter-nx-lib/auth';
import 'orbiter-nx-lib/styles/tokens.css';
```

## Conventions
- **Styles** → co-located `*.module.css`, `data-*` variants, CSS pseudo-classes, design tokens (no raw hex). See the styling rules ported from `orbiter-nx`.
- **No dead code** (`eslint @typescript-eslint/no-unused-vars: error`).
- **File size** target < 300 lines.

## Internal module aliases
Cross-module imports use Node subpath `imports` (`#ui`, `#auth`, `#data-access`, `#types`,
`#i18n`, `#utils`) declared in `package.json` — depth-independent and resolved by both TS
(`moduleResolution: bundler`) and the consuming bundler.
