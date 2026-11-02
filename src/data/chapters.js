// Chapters and their leads, shared by /chapters and /chapters/[slug].
//
// The content lives in GenAI-ID and is edited there (leads edit their own card from ID's
// console). scripts/sync-chapters.mjs refreshes chapters.snapshot.json from
// GET /api/v1/chapters before every build; this module maps that response to the shape the
// pages render. The site is English-only, so it reads the `en` texts.

import snapshot from './chapters.snapshot.json';

// ID's chapter states. Recruiting and backlog chapters have no page or card yet.
const STATUS = { active: 'Active', onboarding: 'Forming' };

const countryName = new Intl.DisplayNames(['en'], { type: 'region' });

const coord = (value, positive, negative) =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

// Stable, readable ids for the bio dialogs and the JSON-LD @id (ID's own ids are uuids).
const leadId = (lead) =>
  lead.shortName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function toLead(lead) {
  return {
    id: leadId(lead),
    name: lead.name,
    shortName: lead.shortName,
    kicker: `Chapter lead · ${lead.kickerArea}`,
    role: lead.role,
    company: lead.company,
    modalRole: lead.modalRole,
    photo: lead.photo,
    photoAlt: lead.photoAlt || lead.name,
    photoPosition: lead.photoPosition || '50% 30%',
    linkedin: lead.linkedin,
    github: lead.github || null,
    website: lead.website?.url ? lead.website : null,
    summary: lead.summary,
    tags: lead.tags,
    quote: lead.quote || null,
    // Leads' own line breaks are kept (the bio renders with white-space: pre-line).
    bio: lead.bio.map((paragraph) => paragraph.replace(/\r\n?/g, '\n')),
  };
}

function toChapter(c) {
  const country = countryName.of(c.country) || c.country;
  return {
    slug: c.slug,
    city: c.city,
    country,
    localName: c.localName || `${c.city}, ${country}`,
    eventCities: c.eventCities?.length ? c.eventCities : [c.city],
    status: STATUS[c.status],
    note: c.note.en,
    established: c.established || null,
    headline: c.headline.en,
    lede: c.lede.en,
    map: {
      // west,south,east,north for the OpenStreetMap embed.
      bbox: c.bbox.map((n) => n.toFixed(4)).join(','),
      lat: c.lat,
      lon: c.lon,
      coords: `${coord(c.lat, 'N', 'S')} · ${coord(c.lon, 'E', 'W')}`,
      query: `${c.city}, ${country}`,
    },
    leads: [...c.leads].sort((a, b) => a.position - b.position).map(toLead),
  };
}

// A chapter is shown once it has its page content: a headline, a lede and at least one lead.
const hasPage = (c) =>
  STATUS[c.status] && c.headline.en.every(Boolean) && c.lede.en && c.leads.length > 0;

export const chapters = [...snapshot.chapters]
  .sort((a, b) => a.position - b.position)
  .filter(hasPage)
  .map(toChapter);

export function getChapterPages() {
  return chapters;
}
