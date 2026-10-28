# Trakko

**Your beat store. Free.** A focused beat storefront and checkout MVP built with Next.js 16.4, React 19.3, TypeScript, Tailwind 4, Supabase, and Stripe Connect. Product naming lives in `src/lib/brand.ts`.

Includes producer auth and onboarding, beat uploads, configurable per-beat licenses, a searchable public store at `/:username`, one persistent audio player, guest checkout, private fulfillment, printable licenses, order details, revenue/plays, and store customization with a live preview. Includes discount codes, beat bundles, free preview downloads with separate marketing consent, conversion/source analytics, bulk uploads and edits, collaborator split accounting, scheduled releases, and queued purchase receipts. Embeddable stores open checkout in a new tab. Stores use a unique customizable `/:username` link; there is no custom-domain feature. There are no subscription plans, exclusives, social features, or pricing-tier upload-count limits.

## Run the local demo

Use Node.js 22.13+ and npm. No accounts, external credentials, Docker, or audio tools are required to run the included demo.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, then:

- `/ziova`: six beats with original artwork and actual MP3 previews.
- `/dashboard`: the producer workspace.
- `/signup`: short demo store onboarding.

Buy a beat, enter any valid email, and select **Complete demo purchase**. This simulates settlement, creates an order, unlocks only the purchased files, and updates revenue, fees, and earnings. It never requests a card or calls Stripe. Demo auth explicitly identifies itself as a sandbox and does not create users or send email.

Demo changes belong to the browser's HTTP-only sandbox cookie and are stored under the OS temporary directory (`offgrid-demo-v1`). Removing the cookie starts a new workspace; temporary storage may be cleared by the OS. Demo receipts need the same sandbox cookie. Uploaded demo files are limited to 100 MB. Bundled demo purchases deliver illustrative original MP3/WAV/stems fixtures; all six beats intentionally share the same purchase fixtures. Uploaded files replace those fixtures for newly created purchases.

Demo mode is enabled only when **both Supabase public credentials are absent** in development. A production build requires `ALLOW_DEMO=true` to run without Supabase; this is only for an intentional preview and must not be used as a production datastore. Supplying Supabase credentials disables demo mode, even if `ALLOW_DEMO=true`.

If port 3000 is occupied, match `APP_URL` to the port you use:

```sh
APP_URL=http://localhost:3001 npm run dev -- --port 3001
```

## Configure Supabase

Choose a fresh test project or run the local stack. Never point a development seed at a store containing real sales.

### Hosted test project

Create a project in Supabase and copy the project URL, publishable key, and server secret key into `.env.local` (`SUPABASE_SERVICE_ROLE_KEY` remains a legacy fallback).

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Alternatively, run the migration SQL in Supabase's SQL editor on a fresh project. The migration in `supabase/migrations/` is authoritative. Do not reapply it to a migrated project.

### Trakko cloud project

Trakko uses project `ekulqhopoqdvkcvhaysb` in the `trakko` organization (US East / Ohio), at `https://ekulqhopoqdvkcvhaysb.supabase.co`. The empty project was initialized through the Supabase plugin with the four committed migrations. Their filenames match the recorded remote migration versions, so future CLI pushes do not reapply the initial schema. The RLS test reads every migration in filename order.

All 14 application tables have RLS enabled. `preview-assets` is public for previews/artwork; `beat-deliverables` is private and served through authorized signed URLs. `upload_intents` deliberately has no client policies: only the server may allocate uploads. The setup migration revokes client execution of Supabase's optional `rls_auto_enable` helper and adds covering foreign-key indexes. New database stores default to the light theme and blue accent; existing preferences are retained.

The local app origin and Auth Site URL are `http://localhost:3000`; the three exact callbacks below are allowlisted. Email/password signup is enabled. No wildcard callbacks, seeded producer accounts, or payment credentials are added by this setup. Configure production SMTP and production HTTPS callbacks before public launch.

Live integration verification completed against this project: server-key authentication, real email/password login through Trakko, session cookies, store onboarding/default licenses, draft beat creation, authenticated dashboard loading, signed preview/private MP3 uploads and finalization, public preview retrieval, unsigned private-file denial, signed private-file retrieval, and logout. The temporary test producer, store, beat, license rows, upload records, and Storage objects were removed afterward. This verified the configured local app against Supabase Cloud; external confirmation-email delivery, production hosting, and Stripe payments are separate launch checks.

Local credentials live only in ignored `.env.local`, with owner-only file permissions. Public URL/key configuration disables demo mode. Set `SUPABASE_SECRET_KEY` from the project's existing secret keys to enable server-side storage, analytics, and fulfillment; the plugin exposes publishable keys only. A dedicated receipt encryption key is generated locally and must remain stable. Never commit this file or copy its contents into issue reports.

### Local stack

Start Docker Desktop first:

```sh
npx supabase start
npx supabase db reset --local
npx supabase status
```

Use the URL and keys printed by `supabase status`. The reset command deletes the **local** database and reapplies migrations. Auth email can be inspected in the local mail inbox linked by `supabase status`.

### Authentication

Enable email/password authentication. Set the Auth Site URL to `APP_URL`, and allow these redirects for each environment:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/onboarding
http://localhost:3000/auth/callback?next=/update-password
```

Add the equivalent HTTPS URLs for your deployed domain. Signup supports confirmation emails; reset links use a PKCE code exchange in `/auth/callback`. The callback only permits onboarding or password-update destinations. Supabase's built-in mail service is sufficient for testing; configure production SMTP for real signups and password resets.

### Schema and storage

The migration creates:

- `profiles`, `stores`, `beats`, `licenses`, `license_deliverables`, `beat_files`.
- `orders` with immutable purchase snapshots and hashed receipt tokens.
- `stripe_accounts`, `play_events`, and server-only `upload_intents`.
- Indexed foreign keys, price constraints, update timestamps, and RLS on all application tables.
- `preview-assets`: **public**, restricted to MP3 and raster images.
- `beat-deliverables`: **private**, restricted to MP3, WAV, and ZIP.

The app issues signed upload URLs after verifying the authenticated store and beat owner. Uploads go directly to Storage, avoiding Vercel request-body limits. Finalization checks the allocated path, actual Storage size/type, and ownership before registering the file. Files use generated UUID paths rather than user-supplied paths. The private bucket has a restrictive policy denying direct anon/authenticated access, even if a permissive policy exists elsewhere in the project. Service-role operations and signed URLs are the only delivery path.

Limits: cover/profile/banner 8 MB; preview MP3 30 MB; untagged MP3 100 MB; WAV 500 MB; ZIP 1 GB. Your Supabase plan's storage object-size limit may be lower; for example, larger WAV/stems files require a project plan that supports that size. These are file-size restrictions, not pricing-tier upload counts.

## Configure Stripe and Connect

1. Create a Stripe sandbox/test account and enable Connect for a platform using Express connected accounts, card payments, and transfers.
2. Set `STRIPE_SECRET_KEY` to the sandbox/test secret key. No Stripe secret belongs in a `NEXT_PUBLIC_` variable.
3. Set `PLATFORM_FEE_PERCENT` (default `8`, accepts up to two decimal places). The platform retains 8% of each completed sale; the producer receives 92%. Stripe processing and Connect costs are deducted from the platform’s share under the current destination-charge model. This is a sales commission, not a share of music publishing or streaming royalties.
4. Optionally set `STRIPE_CONNECT_COUNTRY` to a supported two-letter country; otherwise producers choose during onboarding.
5. Log into the app, open **Settings**, and select **Connect with Stripe**. Complete the test onboarding using Stripe's test details. Both charges and payouts must be enabled before the storefront can sell.
6. Use **Refresh status** after returning from Stripe if the account update webhook has not arrived yet. Connected producers can open the Express dashboard from Settings.

Checkout creates a destination charge on the platform, sets the connected producer as settlement merchant (`on_behalf_of`), transfers to that account, and retains `application_fee_amount`. Processing fees, refunds, and disputes debit the platform under this model; the dashboard's producer earnings are gross proceeds after the platform fee, not a net-of-processing settlement ledger. Region and cross-border support are controlled by Stripe. Use a sandbox platform and connected account in supported regions.

### Local webhook forwarding

Install/login to the Stripe CLI, then forward platform and Connect events:

```sh
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook --forward-connect-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart Next.js. For a hosted endpoint, subscribe to:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
account.updated
charge.refunded
```

Enable events from connected accounts for account updates. If your Stripe setup uses a separate Connect webhook destination, give it the same route with a distinct deployment/configuration that has that destination's signing secret; a signing secret must match the destination that sent the event. The local CLI signing secret covers the forwarded requests for that listener.

Use a real app checkout to test fulfillment. Stripe CLI synthetic `checkout.session.completed` fixtures do not contain a matching app order. In test Checkout, use `4242 4242 4242 4242`, a future expiry, and any valid CVC/postal code.

## Seed the configured test database

Set `SEED_EMAIL` and a strong `SEED_PASSWORD` (at least 10 characters) in `.env.local`:

```sh
npm run seed
```

This creates a confirmed test producer, `/ziova`, six beats, default templates and per-beat licenses, PNG artwork, MP3 previews, and private MP3/WAV/ZIP files. You can rerun it for the same seed account. It refuses to overwrite a `ziova` store owned by a different email. Reusing an existing email without that seeded store is deliberately rejected. No Stripe account is seeded: connect it from Settings.

The fixture files are already included. `scripts/generate-demo.py` regenerates all original vector artwork and synthesized audio using Python's standard library and `ffmpeg`; regeneration is optional. To replace demo audio, put MP3s at `public/demo/preview-1.mp3` through `preview-6.mp3`. Never put purchased source files in `public/`.

## Producer and customer flows

Create account → confirm email if enabled → choose producer name and store URL → create store.

Upload beat → create draft → upload preview/artwork and purchased files → edit prices/terms → publish. New beats copy the default license templates from Settings. Existing beat licenses are independent, so changing defaults does not silently change existing catalog prices. Disable licenses whose files you aren't offering. Publication requires a preview and all files included in active licenses; checkout revalidates availability as well.

Customer: visit store → play/seek preview → choose a license → enter email → Stripe Checkout → private receipt page. No customer account is needed.

## Payments, receipts, and authorization

- All money enters the backend as integer cents. Percentage parsing, rounding, and earnings calculations are centralized in `src/lib/business.ts` and `src/lib/config.ts`, using integer/BigInt arithmetic.
- Checkout prices, producer ownership, file inclusion, Connect account, and license terms are loaded server-side. The browser cannot override them.
- Each order captures the title, producer, price, terms, and exact private file paths. Later edits, replacements, unpublishing, or deletion do not alter a purchased license.
- Only a signature-verified Stripe webhook can settle a real order. A frontend success redirect never marks it paid. The webhook checks session identity, currency, payment state, and total against the snapshot.
- Pending-to-paid updates use an atomic compare-and-set. Duplicate or concurrent webhook deliveries are no-ops. Stripe requests also have idempotency keys. Fully refunded orders lose future download access, including when the refund webhook arrives before settlement.
- Guest receipts use 256-bit random bearer tokens. Their SHA-256 hashes authorize downloads; the complete private URL is separately encrypted with AES-256-GCM for queued receipt emails. Tokens are constant-time compared. Receipt responses never contain source paths or token hashes. Treat a purchase URL like a password and exclude its query string from analytics/log exports.
- Downloads verify the token and completed order, then allow only snapshotted deliverables. Real download links expire after 60 seconds and can be renewed from the receipt. A copied URL may remain valid until its short TTL expires after a refund.
- License documents are escaped, downloadable HTML with an order ID, producer/customer, price, purchase timestamp, included files, and the purchased terms. They can be printed or saved as PDF in the browser.
- Play events are recorded when audio starts, deduplicated per visitor/beat for 60 seconds, and aggregated in PostgreSQL under producer RLS. Plays are useful product analytics, not fraud-proof royalty counts. Dashboard calendar dates use `America/Toronto`, centralized in `src/lib/dates.ts`.
- Private files deliberately remain in Storage after catalog deletion/replacement because older orders reference them. Any future cleanup job must check order snapshots before deleting objects. Expired upload intents/unreferenced failed uploads can be removed by a scheduled maintenance job.

## Design and navigation

The interface follows the user-supplied Geniestudio daylight reference: sky-blue canvas, soft white surfaces, charcoal pill actions, blue accents, and self-hosted variable Inter. The centered homepage pairs oversized medium-weight typography with an interactive listening room; producer workflows use the same light palette. The landing page offers actual playable demo releases and truthful starting license prices. `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` preserve the product and design system. Font licenses ship under `src/app/fonts/`. Dashboard navigation groups music management, growth tools, and store settings. The overview provides a setup checklist until the store has published music and enabled payments. Public stores retain producer theme and accent customization, with an explicit license action and a persistent audio player. Reduced-motion preferences, pointer-aware hover, keyboard focus states, modal labeling, and a focus-trapped mobile navigation drawer are supported. Touch inputs use at least 16px text; viewport and player safe-area settings support mobile browsers. Browser emulation verifies layout and keyboard behavior; sticky hover, the software keyboard, and physical-device safe areas still need testing on an actual phone.

## Producer growth tools

Copy your store link or iframe code from **Store → Share your store**. The public `/:username/embed` route supports listening and search; purchase buttons open the matching beat in the full secure storefront in a new tab. Only this public route permits framing; dashboards, authentication, receipts, and the full store refuse embedding.

Apply all migrations in `supabase/migrations/` in filename order. `store_tools` holds producer-owned promotion, bundle, and collaborator settings; contacts, source events, and receipt jobs have separate private tables. The migration extends beats with release times/free-download terms and orders with immutable item and collaborator snapshots. PostgreSQL tests verify the new RLS rules and receipt queue transaction.

- **Promotions:** `/dashboard/promotions` creates percentage codes with optional expiry, pause/activation, and removal. Codes apply to individual beats and bundles. Quote and checkout validate them server-side; only one code applies per purchase.
- **Bundles:** curated beat sets have a fixed price and common license name. All included beats must be live and have complete active licenses. Discounts and platform fees are allocated across items with integer arithmetic; every beat’s license, files, and collaborator shares are preserved. Receipt links download each included file individually.
- **Audience:** enable free downloads in the beat editor. Visitors accept the producer’s free-use terms and receive the **tagged public preview only**. Marketing permission is a separate unchecked checkbox. `/dashboard/audience` shows permission timestamps and exports contacts as CSV; download-only contacts must not be added to marketing campaigns. Campaign sending is not included.
- **Analytics:** `/dashboard/analytics` covers 7/30/90-day visits, listening visitors, checkout starts, paid orders, and revenue by source. Share `/:username?utm_source=instagram` to measure a channel. Full referral URLs are not retained. Visits/checkout starts are deduplicated in 30-minute windows; charts are product signals, not audited attribution or fraud-proof counts.
- **Bulk tools:** select beats to replace tags, change all active license prices, publish now, or unpublish. Bulk uploads accept up to 25 previews per batch with optional matching purchased files and covers. Unmatched filenames and per-beat failures are reported. Incomplete licenses are disabled; automatic publishing requires a preview and complete files. Failed drafts remain available for retry. Bulk operations report per-beat results and are not a single all-or-nothing transaction.
- **Collaborators:** `/dashboard/collaborators` assigns percentages of producer earnings **after the 8% platform fee**. Total collaborator allocations cannot exceed 100%. Completed sales snapshot shares and report amounts to remit; full refunds are excluded. Export the ledger as CSV. It is accounting, **not automated bank payouts or a record of payments already remitted**.
- **Release scheduling:** a beat with complete files/licenses can be published with a future release time from its editor. Catalog, RLS, playback, free downloads, quotes, and checkout enforce the release time, so no publication worker is needed. Cancel by unpublishing; bulk “Publish now” clears the scheduled time. The editor accepts the user’s local time and stores UTC.

## Purchase emails

Receipt jobs are inserted atomically when an order becomes paid. Set `RESEND_API_KEY` and `RECEIPT_FROM_EMAIL`, and verify the sender domain in Resend. A sending-domain verification supports platform emails; it does not add custom domains to producer storefronts. Set a stable `EMAIL_ENCRYPTION_KEY` before accepting purchases (the server service-role key is the fallback). Keep that key stable during rotations so queued receipt URLs can be decrypted.

The Stripe webhook attempts immediate delivery. Configure your deployment scheduler to call `GET /api/jobs/receipts` every 10 minutes with `Authorization: Bearer YOUR_CRON_SECRET`. Set the matching `CRON_SECRET` in the app. This endpoint is server-only and refuses unauthenticated requests. The worker claims jobs with row locks, retries failures up to five times, and uses a per-order Resend idempotency key. Since Resend only retains these keys for 24 hours, uncertain retries older than 23 hours are stopped for operator reconciliation. Review failed job rows in Supabase before resetting them after checking provider delivery logs.

If email configuration is absent, jobs stay pending and the private in-browser receipt still works. Demo jobs are explicitly labeled **Demo preview** and never contact Resend. `/dashboard/audience` shows delivery status. Authentication emails remain separate and are handled by Supabase. The transport is tested with a mock provider; actual sender verification and delivery need your Resend credentials.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests require a **credential-free local demo**, not your real Supabase environment. Remove the Supabase values from the test environment and run Next.js in development. Tests cover playback and seeking, guest checkout, purchase-file rejection, receipt downloads, fees/earnings, onboarding, uploads, license toggles, publish/unpublish, customization, and navigation/layout at 390 px, discounted bundles, per-item downloads, free-download permission/export, collaborators, traffic attribution, scheduled restrictions, bulk upload/edit workflows, playable landing releases, mobile navigation focus restoration, and coarse-pointer input sizing.

For another port:

```sh
APP_URL=http://localhost:3001 npm run dev -- --port 3001
TEST_BASE_URL=http://localhost:3001 npm run test:e2e
```

`npm test` covers money boundaries, file entitlements, upload/path restrictions, migration execution, RLS isolation between two producers, public/private Storage policies, ownership reassignment, cross-store foreign keys, and atomic/idempotent settlement. Database tests execute actual PostgreSQL SQL through PGlite, with minimal Auth/Storage schema stubs. They do not substitute for a deployed Supabase Storage/Auth integration test.

The project was verified with lint, strict TypeScript, business/database tests, browser demo tests, and a production build. Hosted Supabase configuration is recorded below. The local PostgreSQL suite verifies the full migration chain and producer isolation; a live Stripe test-mode payment still requires Stripe credentials and a connected test account.

`npm audit --omit=dev` reports no production dependency advisories. The Next.js ESLint toolchain currently brings an unpatched `braces` denial-of-service advisory through `fast-glob`; it affects development lint glob processing, not the deployed app. Keep the lockfile and review upstream fixes rather than downgrading the Next.js runtime to satisfy the audit suggestion.

## Deploy to Vercel

1. Add the repository as a Next.js project. Use Node.js 22+ and the default `npm run build` command.
2. Apply migrations to the production Supabase project, then set every required environment variable from `.env.example` in Vercel.
3. Set `APP_URL` to your canonical HTTPS domain. Browser mutation origins must match it. Use the same canonical domain for storefront links and auth redirects; redirect alternate hostnames at the hosting layer.
4. Keep `ALLOW_DEMO=false`. Never seed production with test credentials. Separate preview and production Supabase/Stripe environments.
5. Set the production Auth Site URL/redirect allowlist, production SMTP, Stripe live key, and Stripe webhook destination/signing secret.
6. Connect a real producer, check Storage privacy and RLS advisors in Supabase, and run a complete purchase/fulfillment test against the intended environment before inviting customers.

Production data lives in Supabase. Only local demo mode writes to temporary disk. Uploads bypass serverless body limits through signed Storage uploads. Standard Next.js Node route handlers run checkout, webhook verification, and signed URL generation. No long-running process or local database is needed in production.

## Code map

```text
src/app/                 App Router pages and server endpoints
src/components/          Storefront, player, dashboard, forms, dialogs
src/lib/business.ts      Money and license authorization rules
src/lib/data.ts          RLS-aware reads and producer ownership checks
src/lib/supabase/         Typed server/admin clients and database shape
src/lib/demo.ts           Isolated filesystem sandbox (development only)
supabase/migrations/     Schema, RLS, storage buckets, license/analytics functions
scripts/seed.ts          Configured test-project seed with actual asset uploads
tests/                   Business/RLS tests and browser acceptance checks
public/demo/             Original vector artwork and optimized preview MP3s
demo-private/            Private demo purchase fixtures, outside public assets
```

Implementation references: [Next.js App Router](https://nextjs.org/docs/app), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control), [Stripe destination charges](https://docs.stripe.com/connect/destination-charges), and [Stripe webhooks](https://docs.stripe.com/webhooks).

## Visual design

The current direction follows the user-supplied [Geniestudio reference](design-references/geniestudio.md), applied across the homepage, producer dashboard, authentication, and default light storefront. Sky blue `#ebf5ff`, paper white `#fafdff`, charcoal actions, and blue `#0069e0` accents pair with lavender and peach surfaces. Producers retain their own storefront accent and dark-theme choice. This supersedes the previous pink, green, and charcoal marketing directions.

Variable Inter is self-hosted from the official [google/fonts Inter source](https://github.com/google/fonts/tree/main/ofl/inter), with its SIL Open Font License in `src/app/fonts/Inter-OFL.txt`. Display type uses medium weight and generous scale; cards and controls have soft rounded corners. `DESIGN.md` and `.impeccable/design.json` document the implemented system.

The hero uses an original React/CSS listening room with shared preview playback, keyboard-accessible seeking, precomputed RMS waveforms, pointer depth, and fanned pastel paper layers. It replaces the generated headphone illustration; the PNG and its sidecar are removed. Interaction references: [Aceternity 3D Card](https://ui.aceternity.com/components/3d-card-effect), [Componentry Orbit Card Stack](https://componentry.dev/docs/components/orbit-card-stack), and [21st.dev WaveformPlayer](https://21st.dev/@ruixen.ui/components/waveform-player). These are researched interaction references, not copied source or installed packages. Pointer effects are limited to fine pointers, keyboard focus flattens the console, and reduced motion removes spatial effects.

### Dynamic daylight effects

The homepage includes original WebGL flow and ripple shaders, cursor distortion, and playback-state energy. The listening console floats when idle, settles on hover/focus, and follows the selected demo release. Release cards, workflow icons, and CTA arrows have bounded hover feedback. The manual pause-effects control and hero track-selector buttons were removed at the user’s request. The hero follows playback selected from the release cards.

Shader rendering is capped at 30fps with bounded resolution; hidden/offscreen canvases stop scheduling frames. Reduced motion uses a static shader frame and removes spatial loops. WebGL failure/context loss falls back to the static daylight field. Seven focused browser checks cover shader startup, absence of the removed controls, offscreen suspension, reduced motion, WebGL failure, playback/seeking, and navigation without JavaScript. Browser checks do not certify physical-device GPU performance.

### Supabase server credentials

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the project connection. Put the current `sb_secret_...` server key in `SUPABASE_SECRET_KEY` inside ignored `.env.local` (and your deployment environment). `SUPABASE_SERVICE_ROLE_KEY` remains a compatibility fallback. Neither server key is public. Set a dedicated, stable `EMAIL_ENCRYPTION_KEY` before accepting payments so rotating database credentials does not invalidate queued receipt links. Existing installations continue using their legacy receipt encryption fallback when both server credentials are present.

The preview at port 3001 needs `APP_URL=http://localhost:3001` and matching Supabase Auth redirect URLs for `/auth/callback`, `/auth/callback?next=/onboarding`, and `/auth/callback?next=/update-password`. Keep the production redirect allowlist specific to the production origin. Do not apply Trakko migrations to a database serving another app without confirming that it is the intended target.
