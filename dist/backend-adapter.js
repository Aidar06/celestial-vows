export const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:X8-e2j1w/priglosi';
export const DEFAULT_INVITATION_ID = 4;
export const BISHKEK_TIME_ZONE = 'Asia/Bishkek';

export function sanitizeText(value, maxLength = 600) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function resolveInvitationId(pathname, defaultId = DEFAULT_INVITATION_ID) {
  const firstSegment = String(pathname || '').split('/').filter(Boolean)[0] || '';
  if (!/^\d+$/.test(firstSegment)) return defaultId;
  const id = Number(firstSegment);
  return Number.isSafeInteger(id) && id > 0 ? id : defaultId;
}

export function withBishkekOffset(value) {
  const raw = String(value || '').trim();
  if (!raw) return '2027-06-12T16:00:00+06:00';
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(raw)) return raw;
  return `${raw}+06:00`;
}

function normalizeGuest(guest = {}) {
  return {
    name: sanitizeText(guest.name, 120) || 'Гость',
    wish: sanitizeText(guest.wish, 600),
    guestsCount: Math.max(1, Number.parseInt(guest.guests_count, 10) || 1),
    isAttending: guest.is_attending === true || guest.is_attending === 1 || guest.is_attending === 'true'
  };
}

function normalizeCeremony(ceremony = {}) {
  return {
    time: sanitizeText(ceremony.time, 12),
    title: {
      ru: sanitizeText(ceremony.ceremony_ru, 160),
      ky: sanitizeText(ceremony.ceremony_kg, 160)
    },
    text: {
      ru: sanitizeText(ceremony.text_ru, 500),
      ky: sanitizeText(ceremony.text_kg, 500)
    }
  };
}

export function normalizeInvitation(raw = {}, fallbackId = DEFAULT_INVITATION_ID) {
  const numericId = Number(raw.priglosi_id);
  const invitationId = Number.isSafeInteger(numericId) && numericId > 0 ? numericId : fallbackId;
  const address = raw.adress && typeof raw.adress === 'object' ? raw.adress : {};
  const names = raw.names && typeof raw.names === 'object' ? raw.names : {};

  return {
    id: invitationId,
    names: {
      groom: sanitizeText(names.has, 100) || 'Имя жениха',
      bride: sanitizeText(names.wife, 100) || 'Имя невесты'
    },
    dateISO: withBishkekOffset(raw.date),
    ceremonies: Array.isArray(raw.ceremonies) ? raw.ceremonies.map(normalizeCeremony) : [],
    venue: {
      type: sanitizeText(address.pl, 120),
      name: sanitizeText(address.name, 160),
      address: sanitizeText(address.adrr, 300),
      googleMapsUrl: sanitizeText(address.google_maps_url || address.googleMapsUrl, 1000),
      twoGisUrl: sanitizeText(address.two_gis_url || address.twoGisUrl || address['2gis_url'], 1000),
      latitude: Number.isFinite(Number(address.latitude ?? address.lat)) ? Number(address.latitude ?? address.lat) : null,
      longitude: Number.isFinite(Number(address.longitude ?? address.lng ?? address.lon)) ? Number(address.longitude ?? address.lng ?? address.lon) : null
    },
    guests: Array.isArray(raw.guests) ? raw.guests.map(normalizeGuest) : [],
    raw
  };
}

export function buildMapLinks(venue = {}) {
  const coordinates = Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude)
    ? `${venue.latitude},${venue.longitude}`
    : '';
  const query = coordinates || [venue.name, venue.address].filter(Boolean).join(' ').trim();
  const encoded = encodeURIComponent(query);

  return {
    google: venue.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    twoGis: venue.twoGisUrl || `https://2gis.com/search/${encoded}`
  };
}

export function createGuestPayload(guest = {}) {
  return {
    name: sanitizeText(guest.name, 120),
    wish: sanitizeText(guest.wish, 600),
    guests_count: Math.max(1, Number.parseInt(guest.guestsCount ?? guest.guests_count, 10) || 1),
    is_attending: guest.isAttending === true || guest.is_attending === true
  };
}

export function buildPatchPayload(latestRaw = {}, guest = {}, fallbackId = DEFAULT_INVITATION_ID) {
  const id = Number(latestRaw.priglosi_id) || Number(fallbackId) || DEFAULT_INVITATION_ID;
  const existingGuests = Array.isArray(latestRaw.guests) ? latestRaw.guests.map((item) => ({ ...item })) : [];
  return {
    ...latestRaw,
    priglosi_id: id,
    guests: [...existingGuests, createGuestPayload(guest)]
  };
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchInvitationRaw(id, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(`${API_BASE_URL}/${Number(id)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  if (!response.ok) throw new Error(`Invitation request failed: ${response.status}`);
  const data = await readJson(response);
  if (!data || typeof data !== 'object') throw new Error('Invitation response is empty');
  return data;
}

export function selectFallbackRaw(content = {}, id, defaultId = DEFAULT_INVITATION_ID) {
  const invitations = content.invitations && typeof content.invitations === 'object' ? content.invitations : {};
  return invitations[String(id)] || invitations[String(content.defaultId || defaultId)] || content.invitation || content;
}

export async function fetchFallbackRaw(id, { fetchImpl = fetch, url = './content.json' } = {}) {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Fallback request failed: ${response.status}`);
  const content = await response.json();
  return selectFallbackRaw(content, id);
}

export async function appendGuestToInvitation(id, guest, { fetchImpl = fetch } = {}) {
  const latestRaw = await fetchInvitationRaw(id, { fetchImpl });
  const payload = buildPatchPayload(latestRaw, guest, id);
  const response = await fetchImpl(`${API_BASE_URL}/${Number(id)}/full`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`RSVP request failed: ${response.status}`);
  const responseData = await readJson(response);
  const raw = responseData && typeof responseData === 'object'
    ? {
        ...payload,
        ...responseData,
        names: responseData.names || payload.names,
        ceremonies: responseData.ceremonies || payload.ceremonies,
        adress: responseData.adress || payload.adress,
        guests: responseData.guests || payload.guests
      }
    : payload;
  return { raw, invitation: normalizeInvitation(raw, id), payload };
}
