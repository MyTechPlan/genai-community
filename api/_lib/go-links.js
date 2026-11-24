// Short links for printed QR codes: /go/<slug> → a destination with UTM tags.
// Adding a city is one entry here; the printed QR only carries /go/<slug>,
// so the UTM tags can change after printing.

export const GO_LINKS = {
  london: {
    destination: '/join',
    utm: { utm_source: 'rollup', utm_medium: 'qr', utm_campaign: 'london-meetup' },
  },
};

// Unknown slugs still land on the signup, without campaign tags.
export const FALLBACK_DESTINATION = '/join';

const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;

export function resolveGoLink(rawSlug) {
  const slug = typeof rawSlug === 'string' ? rawSlug.trim().toLowerCase() : '';
  if (!SLUG_PATTERN.test(slug) || !Object.hasOwn(GO_LINKS, slug)) {
    return { slug: null, location: FALLBACK_DESTINATION };
  }
  const link = GO_LINKS[slug];
  const query = new URLSearchParams(link.utm).toString();
  return { slug, location: query ? `${link.destination}?${query}` : link.destination };
}
