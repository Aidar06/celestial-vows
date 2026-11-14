export const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:X8-e2j1w/priglosi';
export const DEFAULT_INVITATION_ID = 1;
export const BISHKEK_TIME_ZONE = 'Asia/Bishkek';

const SUPPORTED_LANGUAGES = ['ru', 'ky', 'kk'];

export function sanitizeText(value, maxLength = 600) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function resolveInvitationId(pathname, defaultId = DEFAULT_INVITATION_ID) {
  const firstSegment = String(pathname || '').split('/').filter(Boolean)[0];
  if (!firstSegment) return String(defaultId);
  const publicId = decodeURIComponent(firstSegment).trim();
  return /^[A-Za-z0-9_-]{1,128}$/.test(publicId) ? publicId : null;
}

export function withBishkekOffset(value) {
  const text = String(value || '');
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}+06:00`;
}

function hasContent(entry, fields) {
  return fields.some((field) => sanitizeText(entry?.[field]).length > 0);
}

function pickLocalized(source, language, defaultLanguage, fields) {
  for (const candidate of [...new Set([language, defaultLanguage, 'ru'])]) {
    const entry = source?.[candidate];
    if (hasContent(entry, fields)) return entry;
  }
  return {};
}

function normalizeGuest(guest = {}) {
  const isAttending = guest.is_attending === true;
  return {
    name: sanitizeText(guest.name, 120) || 'Гость',
    wish: sanitizeText(guest.wish, 600),
    guestsCount: isAttending ? Math.max(1, Number(guest.guests_count) || 1) : 0,
    isAttending
  };
}

export function normalizeInvitation(raw = {}, fallbackId = DEFAULT_INVITATION_ID) {
  const id = String(raw.public_id ?? fallbackId);
  const names = raw.names || {};
  const enabled = [...new Set((raw.languages?.enabled || ['ru']).filter((language) => SUPPORTED_LANGUAGES.includes(language)))];
  if (!enabled.length) enabled.push('ru');
  const defaultLanguage = enabled.includes(raw.languages?.default) ? raw.languages.default : enabled[0];

  const invitation = {};
  const wishContent = {};
  const venueContent = {};
  for (const language of SUPPORTED_LANGUAGES) {
    const invitationEntry = pickLocalized(raw.invitation, language, defaultLanguage, ['title', 'text']);
    invitation[language] = {
      title: sanitizeText(invitationEntry.title, 180),
      text: sanitizeText(invitationEntry.text, 1200)
    };

    const wishEntry = pickLocalized(raw.wish_block?.content, language, defaultLanguage, ['title', 'text']);
    wishContent[language] = {
      title: sanitizeText(wishEntry.title, 180),
      text: sanitizeText(wishEntry.text, 1200)
    };

    const venueEntry = pickLocalized(raw.venue?.content, language, defaultLanguage, ['name', 'type', 'address']);
    venueContent[language] = {
      name: sanitizeText(venueEntry.name, 160),
      type: sanitizeText(venueEntry.type, 120),
      address: sanitizeText(venueEntry.address, 300)
    };
  }

  const ceremonies = [...(Array.isArray(raw.ceremonies) ? raw.ceremonies : [])]
    .sort((left, right) => (Number(left.sort_order) || 0) - (Number(right.sort_order) || 0))
    .map((item) => {
      const title = {};
      const text = {};
      for (const language of SUPPORTED_LANGUAGES) {
        const entry = pickLocalized(item.content, language, defaultLanguage, ['title', 'text']);
        title[language] = sanitizeText(entry.title, 180);
        text[language] = sanitizeText(entry.text, 800);
      }
      return { time: sanitizeText(item.time, 12), title, text };
    });

  return {
    id,
    names: {
      groom: sanitizeText(names.groom, 100),
      bride: sanitizeText(names.bride, 100)
    },
    dateISO: withBishkekOffset(raw.date),
    invitation,
    wishBlock: {
      enabled: raw.wish_block?.enabled === true,
      content: wishContent
    },
    ceremonies,
    venue: {
      content: venueContent,
      map: {
        enabled: raw.venue?.map?.enabled === true,
        googleUrl: String(raw.venue?.map?.google_url || ''),
        twoGisUrl: String(raw.venue?.map?.two_gis_url || '')
      }
    },
    rsvp: {
      enabled: raw.rsvp?.enabled !== false,
      allowGuestWish: raw.rsvp?.allow_guest_wish === true,
      maxGuests: Math.max(1, Math.trunc(Number(raw.rsvp?.max_guests) || 1))
    },
    languages: { enabled, default: defaultLanguage },
    guests: Array.isArray(raw.guests) ? raw.guests.map(normalizeGuest) : [],
    raw
  };
}

function validMapUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function buildMapLinks(venue = {}, language = 'ru', defaultLanguage = 'ru') {
  const data = venue.content?.[language] || venue.content?.[defaultLanguage] || venue.content?.ru || {};
  const query = [data.name, data.address].filter(Boolean).join(', ');
  const google = validMapUrl(venue.map?.googleUrl)
    || (query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '');
  const twoGis = validMapUrl(venue.map?.twoGisUrl)
    || (query ? `https://2gis.kg/search/${encodeURIComponent(query)}` : '');
  return { enabled: Boolean(google || twoGis), google, twoGis };
}

export function createGuestPayload(guest = {}, maxGuests = 10) {
  const isAttending = guest.isAttending === true || guest.is_attending === true;
  const safeMaximum = Math.max(1, Math.trunc(Number(maxGuests) || 1));
  const requestedCount = Math.max(1, Math.trunc(Number(guest.guestsCount ?? guest.guests_count) || 1));
  return {
    name: sanitizeText(guest.name, 120),
    wish: sanitizeText(guest.wish, 600),
    guests_count: isAttending ? Math.min(requestedCount, safeMaximum) : 0,
    is_attending: isAttending
  };
}

export function buildPatchPayload(raw = {}, guest = {}, fallbackId = DEFAULT_INVITATION_ID) {
  const existingGuests = Array.isArray(raw.guests) ? raw.guests : [];
  if (!Array.isArray(raw.guests)) {
    console.warn('Backend response does not include guests; previous guest responses cannot be preserved.');
  }
  return {
    languages: raw.languages,
    names: raw.names,
    date: raw.date,
    invitation: raw.invitation,
    wish_block: raw.wish_block,
    ceremonies: raw.ceremonies,
    venue: raw.venue,
    rsvp: raw.rsvp,
    guests: [...existingGuests, createGuestPayload(guest, raw.rsvp?.max_guests)]
  };
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchInvitationRaw(id, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(`${API_BASE_URL}/${encodeURIComponent(String(id))}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal
  });
  if (!response.ok) throw Error(response.status);
  return readJson(response);
}

export function selectFallbackRaw(content = {}, id) {
  return content.invitations?.[String(id)] || content.invitations?.['1'] || content.invitation || content;
}

export async function fetchFallbackRaw(id, { fetchImpl = fetch, url = './content.json' } = {}) {
  const response = await fetchImpl(url);
  if (!response.ok) throw Error(response.status);
  return selectFallbackRaw(await response.json(), id);
}

export async function appendGuestToInvitation(id, guest, { fetchImpl = fetch } = {}) {
  const latest = await fetchInvitationRaw(id, { fetchImpl });
  const payload = buildPatchPayload(latest, guest, id);
  const response = await fetchImpl(`${API_BASE_URL}/${encodeURIComponent(String(id))}/full`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw Error(response.status);
  return {
    raw: payload,
    invitation: normalizeInvitation(payload, id),
    guestsMissingFromGet: !Array.isArray(latest.guests)
  };
}
