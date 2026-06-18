import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://genaicommunity.eu',
  // Keep the "coming soon" /blog out of the sitemap while it's noindex.
  // Remove this filter when the blog launches (see roadmap.md).
  integrations: [sitemap({ filter: (page) => page !== 'https://genaicommunity.eu/blog/' })],
});
