import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  appendGuestToInvitation,
  buildMapLinks,
  buildPatchPayload,
  normalizeInvitation,
  resolveInvitationId,
  selectFallbackRaw
} from '../dist/backend-adapter.js';

const root = path.resolve(import.meta.dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'dist/content.json'), 'utf8'));
const raw = selectFallbackRaw(content, 4);
const normalized = normalizeInvitation(raw, 4);

assert.equal(resolveInvitationId('/3'), 3);
assert.equal(resolveInvitationId('/4/'), 4);
assert.equal(resolveInvitationId('/wrong', 4), 4);
assert.equal(normalized.names.groom, 'Аман');
assert.equal(normalized.dateISO, '2027-08-21T15:00:00+06:00');
assert.match(normalized.ceremonies[1].title.ky, /Никеге/);

const links = buildMapLinks(normalized.venue);
assert.equal(links.google, 'https://www.google.com/maps/search/?api=1&query=%D0%90%D0%BB%D0%B0-%D0%A2%D0%BE%D0%BE%20%D1%83%D0%BB.%20%D0%9C%D0%B0%D0%BB%D0%B4%D1%8B%D0%B1%D0%B0%D0%B5%D0%B2%D0%B0%2C%2054%2F1');
assert.equal(links.twoGis, 'https://2gis.com/search/%D0%90%D0%BB%D0%B0-%D0%A2%D0%BE%D0%BE%20%D1%83%D0%BB.%20%D0%9C%D0%B0%D0%BB%D0%B4%D1%8B%D0%B1%D0%B0%D0%B5%D0%B2%D0%B0%2C%2054%2F1');

const newGuest = { name: '<b>Тест</b>', wish: '<script>bad()</script> Счастья!', guestsCount: '2', isAttending: true };
const patch = buildPatchPayload(raw, newGuest, 4);
assert.equal(patch.priglosi_id, 4);
assert.deepEqual(patch.names, raw.names);
assert.deepEqual(patch.ceremonies, raw.ceremonies);
assert.deepEqual(patch.adress, raw.adress);
assert.equal(patch.guests.length, raw.guests.length + 1);
assert.equal(patch.guests.at(-1).name, 'Тест');
assert.equal(patch.guests.at(-1).wish, 'bad() Счастья!');
assert.equal(patch.guests.at(-1).guests_count, 2);
assert.equal(typeof patch.guests.at(-1).guests_count, 'number');

const calls = [];
const mockFetch = async (url, options = {}) => {
  calls.push({ url, options });
  if ((options.method || 'GET') === 'GET') return new Response(JSON.stringify(raw), { status: 200 });
  return new Response(JSON.stringify(JSON.parse(options.body)), { status: 200 });
};
const submitted = await appendGuestToInvitation(4, newGuest, { fetchImpl: mockFetch });
assert.equal(calls.length, 2);
assert.equal(calls[0].options.method, 'GET');
assert.equal(calls[1].options.method, 'PATCH');
assert.equal(submitted.invitation.guests.at(-1).guestsCount, 2);
assert.equal(submitted.invitation.guests.length, raw.guests.length + 1);

const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/styles.css'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
for (const value of ['ң','ө','ү','Ң','Ө','Ү']) assert(`${html}${app}`.includes(value), `Missing Kyrgyz character: ${value}`);
for (const marker of ['guestSheetBackdrop','data-language="ru"','target="_blank"','rel="noopener noreferrer"']) assert(html.includes(marker), `Missing UI marker: ${marker}`);
for (const marker of ['Escape','localStorage','appendGuestToInvitation','renderGuestList','Asia/Bishkek']) assert(app.includes(marker) || marker === 'Asia/Bishkek', `Missing app behavior: ${marker}`);
for (const marker of ['state.isSubmitting','rsvpSubmit.disabled','rsvpStatusKey']) assert(app.includes(marker), `Missing submission state: ${marker}`);
assert(css.includes('html[lang="ky"]') && css.includes('--script:Cormorant'), 'Missing Kyrgyz font override');
assert.equal(vercel.outputDirectory, 'dist');
assert(vercel.rewrites.some((rule) => rule.destination === '/index.html'), 'Missing SPA rewrite');

console.log('Passed: routes, fallback data, adapter, maps, safe numeric RSVP PATCH, RU/KG and guest sheet hooks.');
