# GRMC-Agent-n8n

n8n automation building blocks for Grace Resurrection's contact / prayer-request
workflow.

## Crisis screen

[`nodes/crisis-screen.js`](nodes/crisis-screen.js) is an n8n **Code (Function)**
node that screens incoming items before any automated tier-1 (T1) reply goes out.
It scans the free-text notes for signs of a pastoral-care situation (grief,
illness, crisis, hardship, etc.) and tags each item so a human can be looped in
when needed.

### How it fails

It **fails closed.** Anything ambiguous results in a HOLD so a real person looks
at it rather than an automated reply being sent into a sensitive moment:

- missing / non-object `item.json` → **HOLD**
- none of the expected notes fields present → **HOLD** (the feed likely changed)
- any thrown error during screening → **HOLD**
- a matched crisis term → **HOLD**
- screened clean → cleared to send T1

### Output

Each item is passed through unchanged plus two added fields:

| field | type | meaning |
| --- | --- | --- |
| `crisisFlag` | boolean | `true` = hold for a human, `false` = OK to auto-reply |
| `crisisReason` | string | human-readable explanation of the decision |

Branch your workflow on `crisisFlag` immediately after this node.

### The two knobs

Everything else is fixed; these are the two values intended to be tuned:

- **`HOLD_WHEN_NO_NOTES`** — what to do with a blank notes field.
  `false` (default) sends the T1 reply; `true` holds every blank for review.
- **`CRISIS_TERMS`** — the substring watchlist. Matching is case-insensitive
  substring matching, so stems like `diagnos` catch `diagnosis`/`diagnosed`,
  and `illness` is used instead of `ill` to avoid false hits on words like
  "will".

### Notes fields scanned

`notes`, `message`, `prayerRequest`, `comments` — adjust `NOTES_FIELDS` if the
upstream feed uses different keys.
