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

const SNAPSHOT = new URL('../src/data/chapters.snapshot.json', import.meta.url);
const API_URL = (process.env.GENAI_ID_API_URL || 'https://id.genaicommunity.eu/api/v1').replace(/\/+$/, '');
const API_KEY = process.env.GENAI_ID_API_KEY || '';
const PHOTO_PREFIX = 'https://f003.backblazeb2.com/file/genai-id-media/';
const TIMEOUT_MS = 15000;

const isText = (v) => typeof v === 'string';
const isTextArray = (v) => Array.isArray(v) && v.every(isText);
const isLocalised = (v) => v && typeof v === 'object' && isText(v.en);

// The fields the site renders. Anything missing means the contract changed under us, and a
// half-rendered chapter page is worse than yesterday's data.
function problems(data) {
  if (!data || !Array.isArray(data.chapters) || data.chapters.length === 0) return ['no chapters'];
  const found = [];
  for (const c of data.chapters) {
    const where = c?.slug || '(no slug)';
    if (!isText(c?.slug) || !isText(c.city) || !isText(c.country) || !isText(c.status)) found.push(`${where}: slug/city/country/status`);
    if (!isLocalised(c?.note) || !isLocalised(c?.lede) || !isTextArray(c?.headline?.en)) found.push(`${where}: note/lede/headline`);
    if (!Number.isFinite(c?.lat) || !Number.isFinite(c?.lon) || !Array.isArray(c?.bbox) || c.bbox.length !== 4 || !c.bbox.every(Number.isFinite)) found.push(`${where}: lat/lon/bbox`);
    if (!Number.isFinite(c?.position)) found.push(`${where}: position`);
    if (!Array.isArray(c?.leads)) { found.push(`${where}: leads`); continue; }
    for (const l of c.leads) {
      if (!isText(l?.id) || !l.id || !isText(l.name) || !isText(l.shortName) || !isText(l.role) || !isText(l.company) || !isTextArray(l.bio) || !isTextArray(l.tags) || !Number.isFinite(l.position)) {
        found.push(`${where}: lead ${l?.name || '?'}`);
      }
      if (!isText(l?.photo) || !l.photo.startsWith(PHOTO_PREFIX)) found.push(`${where}: lead ${l?.name || '?'} photo`);
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
}

await main();
