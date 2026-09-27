@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A calculator on the home page that saves every successful calculation to Supabase.

## Architecture

- `app/page.tsx` is a server component that renders the client component `app/calculator.tsx`. That component holds all the calculator state, the button and keyboard input, and the history list.
- `lib/evaluate.ts` is a recursive-descent parser: precedence, parentheses and unary minus. Never use `eval()`. It throws on malformed input or ÷0, and errors are shown in the UI but not saved.
- `lib/supabase.ts` is a browser Supabase client built from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. It throws at import if they're missing. The table is `calcs (id, expression text, result text, created_at)`; RLS allows insert and select for the publishable key. The page shows the 10 newest rows.
- Expressions are stored with ASCII operators (`* / -`). The UI shows `× ÷ −` through `pretty()`.

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
