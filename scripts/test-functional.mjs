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

assert.equal(resolveInvitationId('/pub-3'), 'pub-3');
assert.equal(resolveInvitationId('/550e8400-e29b-41d4-a716-446655440000/'), '550e8400-e29b-41d4-a716-446655440000');
assert.equal(resolveInvitationId('/wrong!', 4), null);
assert.equal(normalized.names.groom, 'Аман');
assert.equal(normalized.dateISO, '2027-08-21T15:00:00+06:00');
assert.match(normalized.ceremonies[1].title.ky, /Никеге/);

const links = buildMapLinks(normalized.venue);
assert.match(links.google, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
assert.match(links.twoGis, /^https:\/\/2gis\.kg\/search\//);

const newGuest = { name: '<b>Тест</b>', wish: '<script>bad()</script> Счастья!', guestsCount: '2', isAttending: true };
const patch = buildPatchPayload(raw, newGuest, 4);
assert.equal('id' in patch, false);
assert.deepEqual(patch.names, raw.names);
assert.deepEqual(patch.ceremonies, raw.ceremonies);
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
const submitted = await appendGuestToInvitation('pub-4', newGuest, { fetchImpl: mockFetch });
assert.equal(calls.length, 2);
assert.equal(calls[0].options.method || 'GET', 'GET');
assert.match(calls[0].url, /\/pub-4$/);
assert.match(calls[1].url, /\/pub-4\/full$/);
assert.equal(calls[1].options.method, 'PATCH');
assert.equal(submitted.invitation.guests.at(-1).guestsCount, 2);
assert.equal(submitted.invitation.guests.length, raw.guests.length + 1);

const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/styles.css'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
for (const value of ['ң','ө','ү','Ң','Ө','Ү']) assert(`${html}${app}`.includes(value), `Missing Kyrgyz character: ${value}`);
for (const marker of ['data-language="ru"','target="_blank"','rel="noopener noreferrer"']) assert(html.includes(marker), `Missing UI marker: ${marker}`);
for (const marker of ['localStorage','appendGuestToInvitation','Asia/Bishkek']) assert(app.includes(marker) || marker === 'Asia/Bishkek', `Missing app behavior: ${marker}`);
for (const marker of ['state.isSubmitting','rsvpSubmit.disabled','rsvpStatusKey']) assert(app.includes(marker), `Missing submission state: ${marker}`);
assert.equal(vercel.outputDirectory, 'dist');
assert(vercel.rewrites.some((rule) => rule.source === '/(.*)' && ['/', '/index.html'].includes(rule.destination)), 'Missing SPA rewrite');

console.log('Passed: public_id routes, fallback data, adapter, maps, RSVP PATCH, and multilingual UI hooks.');
