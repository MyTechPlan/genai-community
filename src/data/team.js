// The community team, shown before the chapter leads in the home ribbon.
// scripts/sync-team.mjs refreshes team.snapshot.json from
// GET /api/v1/community/team before every build.

import snapshot from './team.snapshot.json';
import { leadPlaceholderReason } from './chapter-visibility.js';

export const team = [...snapshot.team]
  .sort((a, b) => a.position - b.position)
  .map((person) => ({
    id: person.id,
    name: person.name,
    firstName: person.name.trim().split(/\s+/)[0],
    title: person.title,
    photo: leadPlaceholderReason(person) ? null : person.photo,
    photoPosition: '50% 30%',
  }));
