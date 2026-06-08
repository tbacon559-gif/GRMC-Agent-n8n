// CRISIS SCREEN — fails CLOSED. Errors / broken item / missing notes => HOLD.
// Two things are yours to set: HOLD_WHEN_NO_NOTES and CRISIS_TERMS.
//
// Drop this into an n8n Code (Function) node running once per all items.
// It reads the incoming contact/prayer-request items, scans the free-text
// notes fields for anything that looks like a pastoral-care situation, and
// tags each item with `crisisFlag` (boolean) + `crisisReason` (string).
// Downstream you branch on `crisisFlag`: true => HOLD for a human;
// false => OK to send the automated T1 (tier-1) reply.

const HOLD_WHEN_NO_NOTES = false; // blank notes: false=send T1, true=hold every blank

const CRISIS_TERMS = [
  'died','death','passed away','passing','loss','lost my','lost our',
  'grief','grieving','funeral','mourning','widow',
  'sick','illness','cancer','hospital','hospice','diagnos','surgery',
  'terminal','dying','icu','chemo',
  'depress','suicid','self-harm','self harm','overdose','addiction',
  'relapse','abuse','assault','crisis',
  'divorce','separated','separation','custody','restraining order',
  'struggling','hard time','difficult time','lost my job','laid off',
  'evicted','homeless','desperate','prayer request','pray for','urgent',
];

const NOTES_FIELDS = ['notes','message','prayerRequest','comments'];

const out = [];
for (const item of $input.all()) {
  let crisisFlag = true;                  // fail-safe default: HOLD
  let crisisReason = 'unscreened - held';
  try {
    const g = item.json;
    if (!g || typeof g !== 'object') throw new Error('item.json missing or not an object');

    const hasNotesKey = NOTES_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(g, k));
    if (!hasNotesKey) {
      crisisFlag = true;
      crisisReason = 'expected notes field absent - held (check the feed)';
    } else {
      const text = NOTES_FIELDS.map((k) => g[k]).filter((v) => typeof v === 'string')
        .join(' \n ').toLowerCase().trim();
      if (text === '') {
        crisisFlag = HOLD_WHEN_NO_NOTES;
        crisisReason = HOLD_WHEN_NO_NOTES ? 'no notes - held by policy' : 'no notes - cleared by policy';
      } else {
        const hits = CRISIS_TERMS.filter((t) => text.includes(t));
        crisisFlag = hits.length > 0;
        crisisReason = hits.length > 0 ? 'matched: ' + hits.join(', ') : 'screened clean';
      }
    }
  } catch (err) {
    crisisFlag = true;                    // ANY error => hold
    crisisReason = 'screen error - held: ' + (err && err.message ? err.message : String(err));
  }
  out.push({ json: { ...(item.json && typeof item.json === 'object' ? item.json : {}), crisisFlag, crisisReason } });
}
return out;
