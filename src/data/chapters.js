// Chapters and their leads, shared by /chapters and /chapters/[slug].
//
// The content lives in GenAI-ID and is edited there (leads edit their own card from ID's
// console). scripts/sync-chapters.mjs refreshes chapters.snapshot.json from
// GET /api/v1/chapters before every build; this module maps that response to the shape the
// pages render. The site is English-only, so it reads the `en` texts.

import snapshot from './chapters.snapshot.json';
import { chapterStatus, chapterOmissionReason, leadPlaceholderReason } from './chapter-visibility.js';

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

function toLead(lead, usedIds) {
  const baseId = leadId(lead);
  let id = baseId;
  if (!id || usedIds.has(id)) {
    const fallback = `${baseId || 'lead'}-${lead.id.slice(0, 8)}`;
    id = fallback;
    let suffix = 2;
    while (usedIds.has(id)) id = `${fallback}-${suffix++}`;
  }
  usedIds.add(id);
  return {
    id,
    name: lead.name,
    shortName: lead.shortName,
    kicker: `Chapter lead · ${lead.kickerArea}`,
    role: lead.role,
    company: lead.company,
    modalRole: lead.modalRole,
    photo: leadPlaceholderReason(lead) ? null : lead.photo,
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
  const usedIds = new Set();
  return {
    slug: c.slug,
    city: c.city,
    country,
    localName: c.localName || `${c.city}, ${country}`,
    eventCities: c.eventCities?.length ? c.eventCities : [c.city],
    status: chapterStatus(c),
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
    leads: [...c.leads]
      .sort((a, b) => a.position - b.position).map((lead) => toLead(lead, usedIds)),
  };
}

// A public page needs content, map coordinates and at least one lead.
export const chapters = [...snapshot.chapters]
  .sort((a, b) => a.position - b.position)
  .filter((chapter) => !chapterOmissionReason(chapter))
  .map(toChapter);

export function getChapterPages() {
  return chapters;
}
