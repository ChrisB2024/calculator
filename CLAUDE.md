@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fresh `create-next-app` scaffold. The calculator itself is not built yet: `app/page.tsx` is still the template page.

## Stack

- Next.js 16.3 (App Router, `app/` directory), React 19.2, TypeScript (strict)
- Tailwind CSS v4, configured through `@tailwindcss/postcss`. There is no `tailwind.config.*`; theme tokens live in the `@theme inline` block in `app/globals.css`
- Path alias: `@/*` maps to the repo root

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # ESLint 9 flat config (next core-web-vitals + typescript)
npx tsc --noEmit # type-check only
```

No test framework is set up yet.

## Next.js version warning

Per `AGENTS.md` (imported above), read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` covers the App Router) before writing Next-specific code. One example already in the code: `app/layout.tsx` types its props with the global `LayoutProps<"/">` helper. `next dev` regenerates the `AGENTS.md` block, so don't remove it.
