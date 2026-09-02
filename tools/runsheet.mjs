/**
 * tools/runsheet.mjs — generates docs/RUNSHEET.md from src/beats.js.
 *
 * WHY THIS IS GENERATED AND NOT WRITTEN
 *
 *   "The speech will be rewritten several more times before presentation day.
 *    In a manifest, a rewrite is a text edit. Scattered across scene files, a
 *    rewrite is an archaeology expedition." (CONTEXT.md §5)
 *
 * A hand-written run sheet is exactly that second thing. It would be correct
 * for about a day, and then every rewrite would leave a document that quietly
 * disagrees with what the deck actually does — which is worse than no document,
 * because people trust it.
 *
 * So beats.js stays the single source of truth and this file renders it.
 *
 *   npm run runsheet
 *
 * Run it after any edit to beats.js and commit the result.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { beats, SECTIONS, QNA, totalBeats } from '../src/beats.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'docs', 'RUNSHEET.md');

/** Script and cue are authored as indented template literals; flatten them. */
const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

const wordCount = (s) => (s ? s.trim().split(/\s+/).length : 0);

/** `{ shard: 0 }` -> `shard: 0` — compact enough to sit inline in a heading. */
const stateOf = (state) =>
  Object.entries(state)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

const caseOf = (caption) => {
  if (!caption) return null;
  if (caption === caption.toLowerCase()) return 'lowercase';
  if (caption === caption.toUpperCase()) return 'UPPERCASE';
  return 'mixed case';
};

/**
 * What the audience actually reads on a beat: one centred caption, or several
 * labels each anchored to its own thing on screen. A beat has one or the
 * other, never both.
 */
const onScreen = (beat) => beat.caption ?? (beat.labels ? beat.labels.join(' · ') : null);

const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label ?? id;
const sectionKey = (id) => SECTIONS.find((s) => s.id === id)?.key ?? '?';

const out = [];
const w = (line = '') => out.push(line);

/* ── Header ─────────────────────────────────────────────────────────────── */

w('# Run Sheet');
w();
w('> **Generated file — do not edit by hand.**');
w('> `src/beats.js` is the source of truth. Edit that, then run `npm run runsheet`.');
w();
w('Every beat in speaking order: what the speaker says, where to click, what the');
w('deck does, and what the audience reads.');
w();
const withText = beats.filter((b) => onScreen(b)).length;
w(`**${totalBeats} beats** · **${beats.filter((b) => b.handoff).length} handoffs** · ` +
  `**${withText} beats with on-screen text** ` +
  `(${totalBeats - withText} carry none)`);
w();
w('Quote the **id** when a beat needs changes — ids are stable and never');
w('renumbered, so `roots-02` survives an inserted beat and "slide 7" does not.');
w('The same id shows in the deck\'s tracker (bottom right, `H` to toggle).');
w();

/* ── Summary table ──────────────────────────────────────────────────────── */

w('## At a glance');
w();
w('| # | id | Section | Speaker | On screen |');
w('|---|---|---|---|---|');

beats.forEach((beat, i) => {
  const speaker = beat.handoff ? `**${beat.speaker}** ⇠ handoff` : beat.speaker;
  const text = onScreen(beat);
  const caption = text ? `\`${text}\`` : '—';
  w(`| ${i + 1} | [\`${beat.id}\`](#${beat.id}) | ${sectionLabel(beat.section)} | ${speaker} | ${caption} |`);
});

w();
w('Jump keys: ' + SECTIONS.map((s) => `\`${s.key}\` ${s.label}`).join(' · ') + '.');
w();

/* ── The two deliberate pauses ──────────────────────────────────────────── */

w('## The two deliberate pauses');
w();
w('Neither is in the code. Both are the operator\'s, on purpose — a pause baked');
w('into a timer stops being a decision made in the room.');
w();
w('1. **After `cold-01`** — three full beats of silence before the second line.');
w('2. **After `eff-03`** — two full seconds of black before Prevention. Use `B`,');
w('   so the length is chosen in the moment.');
w();

/* ── Beat by beat ───────────────────────────────────────────────────────── */

w('## Beat by beat');
w();

let lastSection = null;

beats.forEach((beat, i) => {
  if (beat.section !== lastSection) {
    lastSection = beat.section;
    w(`### ${sectionLabel(beat.section)}`);
    w();
    w(`Jump key \`${sectionKey(beat.section)}\`.`);
    w();
  }

  const title = onScreen(beat) ? ` — ${onScreen(beat)}` : '';
  w(`#### <a id="${beat.id}"></a>${i + 1} · \`${beat.id}\`${title}`);
  w();

  if (beat.handoff) {
    w(`> **HANDOFF — ${beat.speaker} takes over here.**`);
    w();
  }

  w(`**Speaker** ${beat.speaker} · **Scene** \`${beat.scene}\` · ` +
    `**State** \`${stateOf(beat.state)}\``);
  w();

  w('**Says**');
  w();
  w(`> ${flat(beat.script)}`);
  w();

  if (beat.labels) {
    // Several words at once, each anchored to its own moving thing. The word
    // count is the TOTAL, because the ceiling is about what the audience is
    // asked to read at this beat, not about any one label.
    const total = beat.labels.reduce((n, l) => n + wordCount(l), 0);
    w(`**On screen** ${beat.labels.map((l) => `\`${l}\``).join(', ')} — ` +
      `${beat.labels.length} labels, staggered, ${total} words total, ` +
      `${caseOf(beat.labels.join(' '))}` +
      `${total > 5 ? ' — **over the 5-word ceiling, deliberately**' : ''}`);
  } else if (beat.caption) {
    w(`**On screen** \`${beat.caption}\` — ${wordCount(beat.caption)} word` +
      `${wordCount(beat.caption) === 1 ? '' : 's'}, ${caseOf(beat.caption)}` +
      `${wordCount(beat.caption) > 5 ? ' — **over the 5-word ceiling, deliberately**' : ''}`);
  } else {
    w('**On screen** nothing. The voice carries this beat.');
  }
  w();

  w(`**Click cue** ${flat(beat.cue)}`);
  w();
});

/* ── Q&A ────────────────────────────────────────────────────────────────── */

w('### Q&A hold');
w();
w('#### <a id="qna"></a>`qna` — a mode, not a beat');
w();
w(`**Scene** \`${QNA.scene}\` · **State** \`${stateOf(QNA.state)}\` · **On screen** nothing`);
w();
w('`Q` toggles in from `close-02`, `Q` again returns. It sits outside the beat');
w('index deliberately: Q&A length is unknown, and you may want to come back to');
w('the close for a final line.');
w();
w(`**Note** ${flat(QNA.cue)}`);
w();

/* ── Footer ─────────────────────────────────────────────────────────────── */

w('---');
w();
w('Regenerate with `npm run runsheet`. Design reasoning lives in `CONTEXT.md`.');

writeFileSync(OUT, out.join('\n') + '\n', 'utf8');
console.log(`runsheet: wrote ${OUT} (${totalBeats} beats)`);
