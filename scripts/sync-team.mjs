// Runs before `astro build`: refreshes src/data/team.snapshot.json from GenAI-ID.
//
// The community team is edited in GenAI-ID, and GET /api/v1/community/team serves it
// with the community product key. The key only exists at build time on the server
// (GENAI_ID_API_KEY, Sensitive, Production only); it never reaches the browser.
//
// The snapshot in the repo is the fallback: without the key (local builds, previews), or
// if ID is down or answers something unexpected, the build keeps the committed snapshot
// and carries on. A good response overwrites the file in the build container only; commit
// a refreshed snapshot from time to time so the fallback stays recent.

import { readFile, writeFile } from 'node:fs/promises';
import { leadPlaceholderReason } from '../src/data/chapter-visibility.js';

const SNAPSHOT = new URL('../src/data/team.snapshot.json', import.meta.url);
const API_URL = (process.env.GENAI_ID_API_URL || 'https://id.genaicommunity.eu/api/v1').replace(/\/+$/, '');
const API_KEY = process.env.GENAI_ID_API_KEY || '';
const TIMEOUT_MS = 15000;

const isText = (v) => typeof v === 'string';
const isTextArray = (v) => Array.isArray(v) && v.every(isText);
const isUuid = (v) => isText(v) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isHttps = (v) => {
  if (!isText(v)) return false;
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
};
const isLink = (v) => v === '' || isHttps(v);

// Validate the fields the site renders, including an empty team and missing photos.
// Wrong types or unsafe links keep the previous snapshot instead of breaking a page.
function problems(data) {
  if (!data || !Array.isArray(data.team)) return ['team is not an array'];
  const found = [];
  for (const person of data.team) {
    const where = isUuid(person?.id) ? person.id : '(no valid id)';
    if (!isUuid(person?.id) || !['name', 'role', 'company'].every((field) => isText(person?.[field])) || !isTextArray(person?.bio)) {
      found.push(`${where}: id/name/role/company/bio`);
    }
    if (!isText(person?.name) || !person.name.trim()) found.push(`${where}: name`);
    if (!isText(person?.title) || !person.title.trim() || person.title.length > 120) found.push(`${where}: title`);
    if (person?.photo !== null && !isText(person?.photo)) found.push(`${where}: photo`);
    if (!Number.isFinite(person?.position)) found.push(`${where}: position`);
    if (!isLink(person?.linkedin) || !isLink(person?.github) || !(person?.website === null || (typeof person?.website === 'object' && !Array.isArray(person.website) && isHttps(person.website?.url) && isText(person.website?.label)))) {
      found.push(`${where}: links`);
    }
  }
  return found;
}

async function main() {
  if (!API_KEY) {
    console.log('[team] GENAI_ID_API_KEY not set: using the committed snapshot');
    return;
  }
  let data;
  try {
    const response = await fetch(`${API_URL}/community/team`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.warn(`[team] GenAI-ID unavailable (${error?.name === 'TimeoutError' ? 'timeout' : error.message}): using the committed snapshot`);
    return;
  }
  const found = problems(data);
  if (found.length) {
    console.warn(`[team] unexpected response from GenAI-ID, using the committed snapshot:\n  ${found.join('\n  ')}`);
    return;
  }
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = await readFile(SNAPSHOT, 'utf8').catch(() => '');
  await writeFile(SNAPSHOT, next);
  console.log(`[team] ${data.team.length} people from GenAI-ID${next === current ? ' (same as the snapshot)' : ' (newer than the snapshot)'}`);
  for (const person of data.team) {
    const reason = leadPlaceholderReason(person);
    if (reason) console.warn(`[team] person ${person.id} shown with a placeholder: ${reason}`);
  }
}

await main();
