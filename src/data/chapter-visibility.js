// Shared by the snapshot sync warnings and the page mapper.
export const PHOTO_PREFIX = 'https://f003.backblazeb2.com/file/genai-id-media/';

const STATUS = { active: 'Active', onboarding: 'Forming' };
export const chapterStatus = (chapter) => Object.hasOwn(STATUS, chapter.status) ? STATUS[chapter.status] : undefined;

export function leadOmissionReason(lead) {
  if (lead.photo === null) return 'photo is null';
  if (!lead.photo.startsWith(PHOTO_PREFIX)) return 'photo is outside the allowed media prefix';
  return null;
}

export function chapterOmissionReason(chapter) {
  const reasons = [];
  if (!chapterStatus(chapter)) reasons.push('status has no public page');
  if (!chapter.headline.en.every(Boolean)) reasons.push('missing headline');
  if (!chapter.lede.en) reasons.push('missing lede');
  if (chapter.lat === null || chapter.lon === null) reasons.push('missing coordinates');
  if (chapter.bbox === null) reasons.push('missing bbox');
  if (!chapter.leads.some((lead) => !leadOmissionReason(lead))) reasons.push('no leads with an allowed photo');
  return reasons.length ? reasons.join('; ') : null;
}
