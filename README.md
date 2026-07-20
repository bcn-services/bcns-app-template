---
type: workflow-app
delivery: hosted-web
name: "@nseluga/hosted-web-template"
status: template
---

# hosted-web template

A runnable **Next.js 14 (App Router, TypeScript strict)** starter for the
standard hosted client app. It depends on the shared packages `@nseluga/ui`,
`@nseluga/config`, and `@nseluga/app-core` as **versioned dependencies from GitHub
Packages**, and ships with the wiring points a real client build needs —
env-driven config, an opt-in AI module, and a Stripe subscription webhook — as
safe, keyless stubs.

> This is a **GitHub Template Repository**. Create a client repo with
> **"Use this template"** (name it `bcns-client-<slug>`, keep it Private), then
> rename `"name"` in `package.json` from `@nseluga/hosted-web-template` to your
> client's package name.

## Quick start

The `@nseluga/*` deps come from the private GitHub Packages registry (see `.npmrc`),
so set a token first:

```bash
export GITHUB_TOKEN=<PAT with read:packages>   # any machine that installs

pnpm install        # resolves @nseluga/* from GitHub Packages
pnpm dev            # serves on :3100
pnpm build
pnpm test
```

The app builds and serves an HTTP 200 home page with **no environment variables
set** and the AI feature flag **off**. Nothing reads `process.env` at import or
build time — config is read lazily inside request handlers (`lib/env.ts`), so
missing keys degrade gracefully instead of crashing.

## Environment variables

Copy `.env.example` → `.env.local` and fill in real values. `.env.example` is
committed with **placeholders only — no real secrets**. See `lib/env.ts` for
the single accessor; documented vars: `DATABASE_URL` (Neon), Clerk
(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), Stripe
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), and the per-app
`ANTHROPIC_API_KEY` plus its `AI_ENABLED` flag.

## Opt-in AI module (`lib/ai.ts`)

AI is **genuinely opt-in**. `maybeGetAiClient` checks `AI_ENABLED` first and
returns `null` before `@nseluga/app-core`'s `createAnthropicClient` is ever
referenced. The client is constructed only when the flag is on **and** a key is
present. The client's Anthropic key is read from env, never from source. See
`tests/ai-optin.test.mjs` for the import-boundary proof of non-invocation.

## Stripe subscription webhook (`app/api/stripe/webhook/route.ts`)

The route parses/validates an incoming event and routes the provision/suspend
decision through `@nseluga/app-core`'s pure `decideFromEvent`/`decideAccess`.
Signature verification is a documented **stub** (no Stripe SDK bundled); real
deployments must call `stripe.webhooks.constructEvent` with
`STRIPE_WEBHOOK_SECRET` before trusting the payload. The decision logic lives in
`lib/webhook.ts` so it is unit-tested independently (`tests/webhook.test.mjs`).

## Relationship to the bcns platform repo

This standalone repo was extracted from `templates/hosted-web/` in the
[`bcns`](https://github.com/nseluga/bcns) platform repo. The shared `@nseluga/*`
packages are developed and published there; this template (and every client repo
generated from it) consumes them by version. To roll out a shared improvement:
publish a new package version from `bcns`, then bump the range here / in each
client repo. See `bcns/SETUP.md` for the full topology and conventions.

## Deploy

See `DEPLOY.md` — Coolify + Cloudflare + Neon + Clerk, built from the
multi-stage `Dockerfile`.
