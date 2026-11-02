import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.genaicommunity.eu',
  integrations: [sitemap()],
  // Chapter lead photos are served by GenAI-ID from its media bucket.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'f003.backblazeb2.com', pathname: '/file/genai-id-media/**' }],
  },
});
