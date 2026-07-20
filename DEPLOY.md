# Deploy — hosted-web

Documentation only. Target stack per `hosting-reference.md` (the platform
reference in `~/os/knowledge/library/bcns/`): a shared **DigitalOcean Droplet**
running one **PM2** process per client app, fronted by **Cloudflare**, with a
per-client **Supabase** project for Postgres, auth, and file storage. No
containers — plain Node processes that move via rsync + connection strings.

## Prerequisites

- The shared DO droplet (Basic 2 vCPU / 4 GB, US region): SSH-key-only auth,
  unattended security upgrades, DO cloud firewall + UFW restricting web
  traffic to Cloudflare IPs, fail2ban, Node + pnpm + PM2 installed, PM2
  startup script registered under systemd.
- A **Supabase project for this client** (project-per-client is the tenant
  isolation model) → gives you `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- A Cloudflare zone (per-client subdomain or the client's own domain via
  CNAME), proxied (orange-cloud), "Full (strict)" TLS.
- (Optional) An Anthropic API key if the AI feature is opted in
  (`AI_ENABLED=1` + `ANTHROPIC_API_KEY`).

## Steps

1. **Supabase** — create the client's project. Apply schema via the committed
   migrations (`supabase/migrations/*.sql`) with the Supabase CLI from CI —
   never hand-run SQL in the dashboard. Copy the connection string and keys.
2. **Env** — on the droplet, put the client's env vars in that client's PM2
   ecosystem entry / env file, readable only by the deploy user. Per-client
   secret separation: this process gets only this client's keys. The
   service-role key bypasses RLS — server-only, never in client-side code.
3. **App** — clone the repo to the droplet, `pnpm install && pnpm build`
   (requires `GITHUB_TOKEN` with `read:packages` for the `@nseluga/*` deps),
   then start under PM2 with an explicit memory limit, e.g.:

   ```bash
   pm2 start "pnpm start" --name <client-slug> --max-memory-restart 512M
   pm2 save
   ```

   Redeploy = `git pull && pnpm install && pnpm build && pm2 reload <client-slug>`.
4. **Cloudflare** — point the client's subdomain at the droplet (proxied).
   Confirm the origin firewall only accepts Cloudflare IPs, and that signed
   /private content is never publicly cached (`Cache-Control: private`).
5. **Monitoring** — UptimeRobot monitor on `https://<domain>/api/health`
   (checks real DB connectivity, 503 on failure); Sentry project tagged with
   the client slug, PII scrubbing on before go-live.

## Notes

- No secrets in the repo or image; everything is injected via env at runtime.
- The app boots and serves 200 with every key absent, so a misconfigured env
  fails soft (feature-by-feature) rather than crashing the process.
- Inbound webhooks (payment processor, SMS provider, accounting) are
  per-client additions: wire real signature verification into the seams in
  `lib/webhooks.ts` — the default verifier is fail-closed and rejects
  everything.
