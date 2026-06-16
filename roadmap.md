# GenAI Community EU — Roadmap

Status of the genaicommunity.eu site and the work still pending.
Production: https://genai-community-three.vercel.app (Vercel project `genai-community`, scope `drzuzzjens-projects`). The GitHub repo `MyTechPlan/genai-community` is connected for auto-deploy on push to `main`, but the working tree hasn't been pushed yet — deploys so far were direct `vercel deploy` CLI uploads.

---

## 🔑 Needs your input (keys / config)

These are blocked on credentials or external setup. The code is ready; only the values/console steps are missing.

- [ ] **reCAPTCHA — allow the domains.** MTP's reCAPTCHA Enterprise key (`6Lfjpl4…`, GCP project `my-tech-plan-1674492903312`) is bound to `mytechplan.com`. In Google Cloud → reCAPTCHA Enterprise → the key's **allowed domains**, add `genaicommunity.eu` (and `genai-community-three.vercel.app` if you want to test on the temp URL). Until then live form submissions can fail server-side assessment (403). The serverless functions are already deployed and `RECAPTCHA_API_KEY` is set in Production.
- [ ] **Resend — verify the sender domain.** Emails currently send **from `noreply@mytechplan.com`** (already verified) **to `community@genaicommunity.eu`**, so they work today. Once `genaicommunity.eu` is verified in Resend, set the Vercel env var `CONTACT_FROM_EMAIL=GenAI Community EU <noreply@genaicommunity.eu>`.
- [ ] **Analytics — provide GenAI Community's own IDs.** Google tags are wired but **dormant**. Create a GTM container + GA4 property for GenAI Community, then set Vercel env vars `PUBLIC_GTM_ID` and `PUBLIC_GA_MEASUREMENT_ID` and redeploy. (Vercel Analytics is already live and needs nothing.) Avoid reusing MTP's IDs — it would mix traffic into MTP's property.
- [ ] **Custom domain — migrate genaicommunity.eu.** Add `genaicommunity.eu` (+ `www`) in the Vercel project's Domains and point DNS. All canonical/OG/sitemap URLs already target the real domain, so SEO consolidates automatically.

### Env vars to set in Vercel (when ready)
| Variable | Status | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ set (Production) | reused from MTP |
| `RECAPTCHA_API_KEY` | ✅ set (Production) | reused from MTP |
| `CONTACT_TO_EMAIL` | ✅ set | `community@genaicommunity.eu` |
| `CONTACT_FROM_EMAIL` | ⬜ optional | flip to `noreply@genaicommunity.eu` after Resend domain verify |
| `PUBLIC_GTM_ID` | ⬜ pending | activates Google Tag Manager |
| `PUBLIC_GA_MEASUREMENT_ID` | ⬜ pending | activates GA4 |
| `PUBLIC_RECAPTCHA_SITE_KEY` | default baked in | override only if a dedicated key is created |

---

## 🔜 Next up (content & launch)

- [ ] **Launch the blog.** Set `BLOG_LIVE = true` in `src/pages/blog/[slug].astro`, add real posts under `src/content/blog/*.md`, restore the homepage "From the blog" post grid (currently a coming-soon card in `src/pages/index.astro`), and replace the `/blog` coming-soon page with the post list. Add per-post `Article` JSON-LD and an RSS feed at that point.
- [ ] **Newsletter provider.** `/api/newsletter` currently emails a signup notification. Wire it to a real ESP (Mailchimp / Beehiiv / Buttondown) with double opt-in for proper GDPR consent + list management.
- [ ] **Chapters as data.** `/chapters` uses a hardcoded array — move to an Astro content collection as the chapter list grows.
- [ ] **Code of conduct page.** Create a code-of-conduct page and add it to the footer (not referenced anywhere yet).
- [ ] **Google Search Console.** Verify `genaicommunity.eu` and submit `https://genaicommunity.eu/sitemap-index.xml`.

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
