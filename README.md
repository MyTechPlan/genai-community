# genaicommunity.eu

Astro 5 static site. MVP landing for the GenAI Community EU.

## Run
npm install
npm run dev      # local
npm run build    # output in dist/

## Structure
- src/pages/index.astro      → landing (hero, what-is, blog teaser, chapters, summit, newsletter)
- src/pages/blog/            → blog index + post pages
- src/content/blog/*.md      → posts (markdown + frontmatter). Add a file = new post.
- src/pages/chapters.astro   → chapters list (hardcoded array, move to collection later)

## TODO before launch
- Wire newsletter form (src/components/Newsletter.astro) to your provider
- Replace sample posts with real ones
- Confirm emails: blog@ and chapters@genaicommunity.eu
- Deploy: vercel --prod (zero config, static output)
