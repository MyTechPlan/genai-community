// Runs before `astro build`: refreshes src/data/chapters.snapshot.json from GenAI-ID.
//
// Chapters and their leads are edited in GenAI-ID, and GET /api/v1/chapters serves them
// with the community product key. The key only exists at build time on the server
// (GENAI_ID_API_KEY, Sensitive, Production only); it never reaches the browser.
//
// The snapshot in the repo is the fallback: without the key (local builds, previews), or
// if ID is down or answers something unexpected, the build keeps the committed snapshot
// and carries on. A good response overwrites the file in the build container only; commit
// a refreshed snapshot from time to time so the fallback stays recent.

import { readFile, writeFile } from 'node:fs/promises';
import { chapterOmissionReason, leadOmissionReason } from '../src/data/chapter-visibility.js';

const SNAPSHOT = new URL('../src/data/chapters.snapshot.json', import.meta.url);
const API_URL = (process.env.GENAI_ID_API_URL || 'https://id.genaicommunity.eu/api/v1').replace(/\/+$/, '');
const API_KEY = process.env.GENAI_ID_API_KEY || '';
const TIMEOUT_MS = 15000;

const isText = (v) => typeof v === 'string';
const isTextArray = (v) => Array.isArray(v) && v.every(isText);
const isLocalised = (v) => v && typeof v === 'object' && isText(v.en);
const isHttps = (v) => isText(v) && v.startsWith('https://');
const isLink = (v) => v === '' || isHttps(v);
const isNullableNumber = (v) => v === null || Number.isFinite(v);

// Validate the fields the site renders, including legitimate nulls for incomplete records.
// Wrong types or unsafe links keep the previous snapshot instead of breaking a page.
function problems(data) {
  if (!data || !Array.isArray(data.chapters) || data.chapters.length === 0) return ['no chapters'];
  const found = [];
  for (const c of data.chapters) {
    const where = c?.slug || '(no slug)';
    if (!isText(c?.slug) || !isText(c.city) || !isText(c.country) || !/^[A-Z]{2}$/.test(c.country) || !isText(c.status)) found.push(`${where}: slug/city/country/status`);
    if (!isLocalised(c?.note) || !isLocalised(c?.lede) || !isTextArray(c?.headline?.en)) found.push(`${where}: note/lede/headline`);
    if (!isNullableNumber(c?.lat) || !isNullableNumber(c?.lon) || !(c?.bbox === null || (Array.isArray(c?.bbox) && c.bbox.length === 4 && c.bbox.every(Number.isFinite)))) found.push(`${where}: lat/lon/bbox`);
    if (!isText(c?.localName) || (c?.established != null && !Number.isFinite(c.established))) found.push(`${where}: localName/established`);
    if (c?.eventCities != null && !isTextArray(c.eventCities)) found.push(`${where}: eventCities`);
    if (!Number.isFinite(c?.position)) found.push(`${where}: position`);
    if (!Array.isArray(c?.leads)) { found.push(`${where}: leads`); continue; }
    for (const l of c.leads) {
      if (!isText(l?.id) || !l.id || !['name', 'shortName', 'kickerArea', 'role', 'company', 'modalRole', 'photoAlt', 'photoPosition', 'summary'].every((field) => isText(l[field])) || !isTextArray(l.bio) || !isTextArray(l.tags) || !Number.isFinite(l.position)) {
        found.push(`${where}: lead ${l?.id || '?'} fields`);
      }
      if (l?.photo !== null && !isText(l?.photo)) found.push(`${where}: lead ${l?.id || '?'} photo`);
      if (l?.quote != null && !isText(l.quote)) found.push(`${where}: lead ${l?.id || '?'} quote`);
      if (!isLink(l?.linkedin) || !isLink(l?.github) || (l?.website != null && (typeof l.website !== 'object' || Array.isArray(l.website) || !isHttps(l.website.url) || !isText(l.website.label)))) {
        found.push(`${where}: lead ${l?.id || '?'} links`);
      }
    }
  }
  return found;
}

async function main() {
  if (!API_KEY) {
    console.log('[chapters] GENAI_ID_API_KEY not set: using the committed snapshot');
    return;
  }
  let data;
  try {
    const response = await fetch(`${API_URL}/chapters`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.warn(`[chapters] GenAI-ID unavailable (${error?.name === 'TimeoutError' ? 'timeout' : error.message}): using the committed snapshot`);
    return;
  }
  const found = problems(data);
  if (found.length) {
    console.warn(`[chapters] unexpected response from GenAI-ID, using the committed snapshot:\n  ${found.join('\n  ')}`);
    return;
  }
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = await readFile(SNAPSHOT, 'utf8').catch(() => '');
  await writeFile(SNAPSHOT, next);
  console.log(`[chapters] ${data.chapters.length} chapters from GenAI-ID${next === current ? ' (same as the snapshot)' : ' (newer than the snapshot)'}`);
  for (const chapter of data.chapters) {
    const reason = chapterOmissionReason(chapter);
    if (reason) console.warn(`[chapters] omitted chapter ${chapter.slug}: ${reason}`);
    for (const lead of chapter.leads) {
      const reason = leadOmissionReason(lead);
      if (reason) console.warn(`[chapters] omitted chapter ${chapter.slug} lead ${lead.id}: ${reason}`);
    }
  }
}

await main();
