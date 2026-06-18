# GenAI Community EU — Roadmap

Status of the genaicommunity.eu site and the work still pending.
Production: https://genai-community-three.vercel.app (Vercel project `genai-community`, scope `drzuzzjens-projects`). The GitHub repo `MyTechPlan/genai-community` is connected for auto-deploy on push to `main`, but the working tree hasn't been pushed yet — deploys so far were direct `vercel deploy` CLI uploads.

---

## 🔑 Needs your input (keys / config)

These are blocked on credentials or external setup. The code is ready; only the values/console steps are missing.

- [x] **reCAPTCHA — domains allowed.** `genaicommunity.eu` + `www.genaicommunity.eu` added to the reCAPTCHA Enterprise key (`6Lfjpl4…`), so forms pass server-side captcha on the live domain. (`RECAPTCHA_API_KEY` already set in Production. The temp `*.vercel.app` URL is not whitelisted, so test on the real domain.)
- [x] **Resend — sender wired & tested.** Form notifications send **from `noreply@genaicommunity.eu`** **to `hello@genaicommunity.eu`** (your Google Workspace inbox), `reply_to` = submitter. `RESEND_API_KEY` in Vercel is now a key from the account where `genaicommunity.eu` is verified (the first reused key was from a different MTP Resend account and failed "domain not verified"). **Verified live** via Playwright: `/api/newsletter` + `/api/contact` → `200`, success message renders. Note: Workspace handles *receiving* (MX); Resend handles *sending* (SPF/DKIM TXT) — they coexist.
- [ ] **Analytics — provide GenAI Community's own IDs.** Google tags are wired but **dormant**. Create a GTM container + GA4 property for GenAI Community, then set Vercel env vars `PUBLIC_GTM_ID` and `PUBLIC_GA_MEASUREMENT_ID` and redeploy. (Vercel Analytics is already live and needs nothing.) Avoid reusing MTP's IDs — it would mix traffic into MTP's property.
- [x] **Custom domain — connected.** `genaicommunity.eu` + `www` are live on Vercel. ⚠️ Open item: the apex 308-redirects to `www`, but the page canonical points to the apex → set the apex as **Primary** in Vercel → Settings → Domains (or ask me to switch the code `site` to `www`) so serving + canonical + Search Console all align on one host.

### Env vars to set in Vercel (when ready)
| Variable | Status | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ set (Production) | reused from MTP |
| `RECAPTCHA_API_KEY` | ✅ set (Production) | reused from MTP |
| `CONTACT_TO_EMAIL` | ✅ set | `hello@genaicommunity.eu` (your Workspace inbox) |
| `CONTACT_FROM_EMAIL` | code default | `noreply@genaicommunity.eu` (verified in Resend) |
| `PUBLIC_GTM_ID` | ⬜ pending | activates Google Tag Manager |
| `PUBLIC_GA_MEASUREMENT_ID` | ⬜ pending | activates GA4 |
| `PUBLIC_RECAPTCHA_SITE_KEY` | default baked in | override only if a dedicated key is created |

---

## 🔜 Next up (content & launch)

- [ ] **Launch the blog.** Set `BLOG_LIVE = true` in `src/pages/blog/[slug].astro`, add real posts under `src/content/blog/*.md`, restore the homepage "From the blog" post grid (currently a coming-soon card in `src/pages/index.astro`), and replace the `/blog` coming-soon page with the post list. **Also revert the SEO holds:** remove `noindex` from `src/pages/blog/index.astro` and the `/blog` sitemap `filter` in `astro.config.mjs`. Add per-post `Article` JSON-LD and an RSS feed at that point.
- [x] **Newsletter → Beehiiv (done).** `/api/newsletter` adds the subscriber to Beehiiv (publication `pub_87fc77fb…`) via API with `double_opt_override: 'on'` (GDPR confirmation email). If Beehiiv errors, it falls back to an email notification to `hello@` so no signup is lost. Verified live (`via: "beehiiv"`). Env: `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_KEY_V2`. Send newsletters from Beehiiv → Broadcasts.
- [ ] **Chapters as data.** `/chapters` uses a hardcoded array — move to an Astro content collection as the chapter list grows.
- [ ] **Code of conduct page.** Create a code-of-conduct page and add it to the footer (not referenced anywhere yet).
### Indexation & measurement (domain is live → actionable now)

- [x] **Sitemap + robots + canonical/OG/JSON-LD** shipped. `/blog` (coming soon) is now `noindex` **and** excluded from the sitemap so Google doesn't index a placeholder; both revert at blog launch (see above).
- [ ] **You — submit the sitemap.** In Search Console (`genaicommunity.eu` already verified ✅) submit `https://genaicommunity.eu/sitemap-index.xml`, then watch the **Pages / Coverage** report and request indexing for the key URLs (home, `/chapters`, `/sponsor`, `/contact`, `/privacy`).
- [ ] **You — apex as Primary.** Vercel → Settings → Domains: make `genaicommunity.eu` the Primary domain (it currently 308-redirects to `www` while the canonical points to the apex). Keeps serving + canonical + GSC aligned on one host. *(Tell me if you'd rather standardize on `www` and I'll switch the code `site`.)*
- [ ] **You — link GA4 ↔ Search Console.** Once GA4 exists (the `G-…` pending above), link them in GA4 Admin → Product links to see search queries inside GA.
- [ ] *(optional)* Submit to **Bing Webmaster Tools** as well.

---

## 🎁 Nice to have

- [ ] Verify the maskable PWA icon on a real Android device (padded variants are in place: `icon-maskable-192/512.png`).
- [ ] Add a `screenshots` array to `site.webmanifest` for a richer Chrome install prompt.
- [ ] Per-page custom OG images (e.g. a sponsor-specific card). Base layout already supports an `ogImage` prop override.
- [ ] Light/dark adaptive favicon (`@media (prefers-color-scheme)` inside `favicon.svg`).
- [ ] Commit & push the current working tree to GitHub — production was shipped via CLI upload; pushing `main` will also trigger an auto-deploy.

---

## ✅ Done

- [x] **Deployed to Vercel** (project created, GitHub repo connected for CI).
- [x] **Forms + captcha** — contact, sponsor, newsletter posting to serverless functions (`api/*.js`) with reCAPTCHA Enterprise + Resend, mirroring the site-blog/mytechplan setup.
- [x] **Analytics** — Consent-Mode-v2 + GTM + GA4 scaffolding (dormant) + Vercel Analytics (live, cookieless).
- [x] **Cookies / GDPR** — consent banner (localStorage `gc_cookie_consent`) + `/privacy` GDPR page + `/rgpd`→`/privacy` redirect + security headers.
- [x] **Blog "coming soon"** — `/blog` placeholder, no posts published, homepage teaser.
- [x] **Brand assets** — `favicon.svg` + `favicon.ico` (16/32/48) + `apple-touch-icon` + PWA icons (192/512 + maskable) + `og-image.png` (1200×630), all derived from the convergence/iris brand mark.
- [x] **SEO** — canonical, Open Graph, Twitter cards, Organization + WebSite JSON-LD, `theme-color`, web app manifest, `robots.txt`, XML sitemap (`@astrojs/sitemap`).
- [x] **llms.txt** — `/llms.txt` (+ `/llm.txt` alias) per the llmstxt.org spec.
