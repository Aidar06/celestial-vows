import {
  BISHKEK_TIME_ZONE,
  DEFAULT_INVITATION_ID,
  appendGuestToInvitation,
  buildMapLinks,
  fetchFallbackRaw,
  fetchInvitationRaw,
  normalizeInvitation,
  resolveInvitationId,
  sanitizeText
} from './backend-adapter.js';

const UI = {
  ru: {
    invitationLabel: 'Приглашение на свадьбу', and: 'и', scrollToInvitation: 'Перейти к приглашению',
    storyKicker: 'Дорогие родные и друзья', storyHeading: 'В нашей истории начинается', storyAccent: 'новая глава',
    storyCopy: 'Есть моменты, которые хочется разделить с самыми близкими. Мы будем счастливы видеть вас рядом в день рождения нашей семьи.',
    storySignature: 'С любовью, наши семьи', saveTheDate: 'Сохраните эту дату', familyBirthday: 'День рождения нашей семьи',
    programLabel: 'Программа дня', programHeading: 'Каждое мгновение', programAccent: 'этого дня',
    venueKicker: 'Место встречи', venueHeading: 'Локация', mapLinks: 'Ссылки на карты',
    answerLabel: 'Ваш ответ', withUsFirst: 'Будете', withUsSecond: 'с нами?',
    rsvpLead: 'Пожалуйста, подтвердите присутствие — нам важно подготовить всё с заботой.',
    yourName: 'Ваше имя', namePlaceholder: 'Как к вам обращаться?', canAttend: 'Вы сможете прийти?',
    willAttend: 'С радостью приду', willNotAttend: 'К сожалению, не смогу', guestCount: 'Количество гостей',
    wishLabel: 'Пожелание молодожёнам', wishPlaceholder: 'Несколько тёплых слов…', sendAnswer: 'Отправить ответ',
    sending: 'Отправляем…', submitSuccess: 'Спасибо! Ваш ответ успешно отправлен.', submitError: 'Не удалось отправить ответ. Проверьте соединение и попробуйте ещё раз.',
    guestList: 'Список гостей', responsesLabel: 'Ответы гостей', close: 'Закрыть', attending: 'Будет', notAttending: 'Не сможет',
    emptyGuests: 'Пока здесь нет ответов гостей.', languageChoice: 'Выбор языка',
    countdownHeading: 'До нашей свадьбы осталось', countdownAria: 'Обратный отсчёт до свадьбы', days: 'дней', hours: 'часов', minutes: 'минут', seconds: 'секунд', withLove: 'С любовью,',
    loading: 'Загружаем приглашение…', fallback: 'Не удалось связаться с сервером. Показаны резервные данные.', fatal: 'Не удалось загрузить данные приглашения.',
    metaTitle: 'Свадебное приглашение', metaDescription: 'Свадебное приглашение', calendar: 'Календарь', weddingDay: 'день свадьбы'
  },
  ky: {
    invitationLabel: 'Үйлөнүү тоюна чакыруу', and: 'жана', scrollToInvitation: 'Чакыруу барагына өтүү',
    storyKicker: 'Кымбаттуу туугандар жана достор', storyHeading: 'Биздин тарыхыбызда', storyAccent: 'жаңы барак ачылууда',
    storyCopy: 'Жакындарыбыз менен бөлүшкүбүз келген өзгөчө учурлар болот. Үй-бүлөбүз жаралган күнү жаныбызда болсоңуздар, биз абдан бактылуу болобуз.',
    storySignature: 'Сүйүү менен, биздин үй-бүлөлөр', saveTheDate: 'Бул күндү белгилеп коюңуз', familyBirthday: 'Үй-бүлөбүздүн туулган күнү',
    programLabel: 'Күндүн программасы', programHeading: 'Бул күндүн ар бир', programAccent: 'көз ирмеми',
    venueKicker: 'Жолугушуу жери', venueHeading: 'Дарек', mapLinks: 'Картадагы шилтемелер',
    answerLabel: 'Сиздин жообуңуз', withUsFirst: 'Биз менен', withUsSecond: 'болосузбу?',
    rsvpLead: 'Катышарыңызды ырастап коюңуз — баарын камкордук менен даярдоо биз үчүн маанилүү.',
    yourName: 'Атыңыз', namePlaceholder: 'Сизге кантип кайрылалы?', canAttend: 'Келе аласызбы?',
    willAttend: 'Кубануу менен келем', willNotAttend: 'Тилекке каршы, келе албайм', guestCount: 'Коноктордун саны',
    wishLabel: 'Жаш жубайларга каалоо', wishPlaceholder: 'Бир нече жылуу сөз…', sendAnswer: 'Жоопту жөнөтүү',
    sending: 'Жөнөтүлүүдө…', submitSuccess: 'Рахмат! Жообуңуз ийгиликтүү жөнөтүлдү.', submitError: 'Жооп жөнөтүлгөн жок. Байланышты текшерип, кайра аракет кылыңыз.',
    guestList: 'Коноктордун тизмеси', responsesLabel: 'Коноктордун жооптору', close: 'Жабуу', attending: 'Келет', notAttending: 'Келе албайт',
    emptyGuests: 'Азырынча коноктордон жооп жок.', languageChoice: 'Тилди тандоо',
    countdownHeading: 'Үйлөнүү тоюбузга калды', countdownAria: 'Үйлөнүү тоюна чейинки убакыт', days: 'күн', hours: 'саат', minutes: 'мүнөт', seconds: 'секунд', withLove: 'Сүйүү менен,',
    loading: 'Чакыруу жүктөлүүдө…', fallback: 'Сервер менен байланыш болгон жок. Камдык маалымат көрсөтүлдү.', fatal: 'Чакыруу маалыматы жүктөлгөн жок.',
    metaTitle: 'Үйлөнүү тоюна чакыруу', metaDescription: 'Үйлөнүү тоюна чакыруу', calendar: 'Жылнаама', weddingDay: 'үйлөнүү күнү'
  }
};

const MONTHS = {
  ru: {
    nominative: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    genitive: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    weekdaysShort: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
    weekdaysLong: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']
  },
  ky: {
    nominative: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    genitive: ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
    weekdaysShort: ['Дш','Шш','Шр','Бш','Жм','Иш','Жк'],
    weekdaysLong: ['Жекшемби','Дүйшөмбү','Шейшемби','Шаршемби','Бейшемби','Жума','Ишемби']
  }
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const defaultId = Number(document.querySelector('meta[name="invitation-default-id"]')?.content) || DEFAULT_INVITATION_ID;
const savedLanguage = (() => { try { return localStorage.getItem('invitation-language'); } catch { return null; } })();
const state = {
  id: resolveInvitationId(location.pathname, defaultId),
  language: savedLanguage === 'ky' ? 'ky' : 'ru',
  invitation: null,
  raw: null,
  source: 'loading',
  isSubmitting: false,
  statusKey: 'loading',
  statusType: 'loading',
  rsvpStatusKey: '',
  lastFocus: null
};

const elements = {
  cloudIntro: document.querySelector('#cloudIntro'), cloudIntroVideos: [...document.querySelectorAll('.cloud-intro-panel')],
  dataStatus: document.querySelector('#dataStatus'),
  groomName: document.querySelector('#groomName'), brideName: document.querySelector('#brideName'), heroNames: document.querySelector('#heroNames'),
  heroDateTime: document.querySelector('#heroDateTime'), heroDay: document.querySelector('#heroDay'), heroMonth: document.querySelector('#heroMonth'), heroYear: document.querySelector('#heroYear'),
  calendar: document.querySelector('#calendar'), calendarDayLarge: document.querySelector('#calendarDayLarge'), calendarHeadingMonth: document.querySelector('#calendarHeadingMonth'), calendarYear: document.querySelector('#calendarYear'), calendarMonth: document.querySelector('#calendarMonth'), calendarWeek: document.querySelector('#calendarWeek'), calendarDays: document.querySelector('#calendarDays'), calendarWeekday: document.querySelector('#calendarWeekday'), weddingTime: document.querySelector('#weddingTime'),
  programTimeline: document.querySelector('#programTimeline'), fallingFlower: document.querySelector('#fallingFlower'),
  venueType: document.querySelector('#venueType'), venueName: document.querySelector('#venueName'), venueAddress: document.querySelector('#venueAddress'), googleMapsLink: document.querySelector('#googleMapsLink'), twoGisLink: document.querySelector('#twoGisLink'),
  rsvpForm: document.querySelector('#rsvpForm'), rsvpSubmit: document.querySelector('#rsvpSubmit'), rsvpSubmitText: document.querySelector('#rsvpSubmit span'), rsvpStatus: document.querySelector('#rsvpStatus'),
  guestName: document.querySelector('#guestName'), guestCount: document.querySelector('#guestCount'), guestWish: document.querySelector('#guestWish'), openGuestSheet: document.querySelector('#openGuestSheet'),
  guestSheetBackdrop: document.querySelector('#guestSheetBackdrop'), guestSheet: document.querySelector('#guestSheet'), closeGuestSheet: document.querySelector('#closeGuestSheet'), guestSheetList: document.querySelector('#guestSheetList'),
  countdownDays: document.querySelector('#countdownDays'), countdownHours: document.querySelector('#countdownHours'), countdownMinutes: document.querySelector('#countdownMinutes'), countdownSeconds: document.querySelector('#countdownSeconds'), countdownNames: document.querySelector('#countdownNames')
};

function activateHeroMedia() {
  const picture = document.querySelector('.hero-picture');
  if (!picture || picture.dataset.loaded === 'true') return;
  picture.querySelectorAll('source[data-srcset]').forEach((source) => {
    source.srcset = source.dataset.srcset;
    delete source.dataset.srcset;
  });
  const image = picture.querySelector('img[data-src]');
  if (image) {
    image.fetchPriority = 'high';
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
  picture.dataset.loaded = 'true';
}

function setupDeferredBackgrounds() {
  const nodes = [...document.querySelectorAll('.deferred-background[data-background-image]')];
  const load = (node) => {
    node.style.backgroundImage = `url("${node.dataset.backgroundImage}")`;
    delete node.dataset.backgroundImage;
    node.classList.remove('deferred-background');
  };
  if (!('IntersectionObserver' in window)) {
    nodes.forEach(load);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '600px 0px' });
  nodes.forEach((node) => observer.observe(node));
}

function setupDeferredImages() {
  const nodes = [...document.querySelectorAll('img[data-src]:not(.hero-art)')];
  const load = (image) => {
    image.src = image.dataset.src;
    delete image.dataset.src;
  };
  if (!('IntersectionObserver' in window)) {
    nodes.forEach(load);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '500px 0px' });
  nodes.forEach((node) => observer.observe(node));
}

function setupCloudIntro() {
  const intro = elements.cloudIntro;
  if (!intro) return;
  document.body.classList.add('intro-locked');
  let opening = false;
  const timers = new Set();
  const later = (callback, delay) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  };
  const hintTimer = later(() => intro.classList.add('has-tap-hint'), 4000);

  const releaseVideo = (video) => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
  };

  const finish = () => {
    timers.forEach(window.clearTimeout);
    timers.clear();
    intro.classList.add('is-finished');
    document.body.classList.remove('intro-locked');
    elements.cloudIntroVideos.forEach(releaseVideo);
  };

  const startFadeSequence = () => {
    if (intro.dataset.sequenceStarted === 'true') return;
    intro.dataset.sequenceStarted = 'true';
    intro.classList.add('is-playing');
    later(() => intro.classList.add('is-fading'), 3000);
    later(finish, 5050);
  };

  const gracefulFallback = () => {
    intro.classList.add('is-fading');
    later(finish, reducedMotion ? 280 : 2050);
  };

  const open = () => {
    if (opening) return;
    opening = true;
    window.clearTimeout(hintTimer);
    timers.delete(hintTimer);
    intro.classList.remove('has-tap-hint');
    intro.classList.add('is-opening');
    intro.setAttribute('aria-hidden', 'true');
    document.body.classList.add('site-ready');
    activateHeroMedia();
    setupDeferredImages();
    setupDeferredBackgrounds();
    if (reducedMotion) {
      intro.classList.add('is-fading');
      later(finish, 280);
      return;
    }
    const video = elements.cloudIntroVideos[0];
    if (!video?.dataset.src) {
      gracefulFallback();
      return;
    }
    video.addEventListener('playing', startFadeSequence, { once: true });
    video.addEventListener('error', gracefulFallback, { once: true });
    video.src = video.dataset.src;
    video.currentTime = 0;
    video.play().catch(gracefulFallback);
  };

  intro.addEventListener('click', open, { once: true });
  intro.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    open();
  });
}

function translate(key) { return UI[state.language][key] || UI.ru[key] || key; }

function setDataStatus(key, type = 'loading', autoHide = 0) {
  state.statusKey = key;
  state.statusType = type;
  const node = elements.dataStatus;
  if (!node) return;
  node.textContent = translate(key);
  node.dataset.type = type;
  node.hidden = false;
  clearTimeout(setDataStatus.timer);
  if (autoHide) setDataStatus.timer = setTimeout(() => { node.hidden = true; state.statusKey = ''; }, autoHide);
}

function clearDataStatus() {
  clearTimeout(setDataStatus.timer);
  state.statusKey = '';
  if (elements.dataStatus) elements.dataStatus.hidden = true;
}

function guestCountLabel(count) {
  const number = Math.max(1, Number(count) || 1);
  if (state.language === 'ky') return `${number} конок`;
  const mod10 = number % 10;
  const mod100 = number % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'гость' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'гостя' : 'гостей';
  return `${number} ${word}`;
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language === 'ky' ? 'ky' : 'ru';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = translate(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = translate(node.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', translate(node.dataset.i18nAria)); });
  document.querySelectorAll('[data-language]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === state.language)));
  document.querySelectorAll('#guestCount option').forEach((option) => { option.textContent = guestCountLabel(option.dataset.count); });
  if (state.isSubmitting) elements.rsvpSubmitText.textContent = translate('sending');
  if (state.rsvpStatusKey) elements.rsvpStatus.textContent = translate(state.rsvpStatusKey);
  if (state.statusKey) setDataStatus(state.statusKey, state.statusType);
}

function dateParts(dateISO) {
  const date = new Date(dateISO);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: BISHKEK_TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return { date, year, month, day, hour: parts.hour, minute: parts.minute, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

function renderDate(invitation) {
  const info = dateParts(invitation.dateISO);
  const months = MONTHS[state.language];
  elements.heroDateTime.dateTime = invitation.dateISO;
  elements.heroDay.textContent = info.day;
  elements.heroMonth.textContent = months.genitive[info.month - 1];
  elements.heroYear.textContent = info.year;
  elements.calendarDayLarge.textContent = info.day;
  elements.calendarHeadingMonth.textContent = months.genitive[info.month - 1];
  elements.calendarYear.textContent = info.year;
  elements.calendarMonth.textContent = months.nominative[info.month - 1];
  elements.calendarWeekday.textContent = months.weekdaysLong[info.weekday];
  if (elements.weddingTime) elements.weddingTime.textContent = `${info.hour}:${info.minute}`;

  elements.calendarWeek.replaceChildren(...months.weekdaysShort.map((label) => {
    const span = document.createElement('span'); span.textContent = label; return span;
  }));

  const firstDayOffset = (new Date(Date.UTC(info.year, info.month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(info.year, info.month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDayOffset; i += 1) { const empty = document.createElement('span'); empty.className = 'empty'; cells.push(empty); }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('span');
    if (day === info.day) {
      cell.className = 'marked';
      cell.setAttribute('aria-label', `${day} ${months.genitive[info.month - 1]} — ${translate('weddingDay')}`);
      const value = document.createElement('b'); value.textContent = day;
      const heart = document.createElement('i'); heart.textContent = '♡'; heart.setAttribute('aria-hidden', 'true');
      cell.append(value, heart);
    } else cell.textContent = day;
    cells.push(cell);
  }
  while (cells.length % 7) { const empty = document.createElement('span'); empty.className = 'empty'; cells.push(empty); }
  elements.calendarDays.replaceChildren(...cells);
  elements.calendar.setAttribute('aria-label', `${translate('calendar')}: ${months.nominative[info.month - 1]} ${info.year}`);
}

function ensureProgramItems(count) {
  let items = [...elements.programTimeline.querySelectorAll('.program-event')];
  while (items.length > count) items.pop().remove();
  while (items.length < count) {
    const index = items.length;
    const article = document.createElement('article');
    article.className = `program-event program-event--${index % 2 ? 'right' : 'left'} reveal`;
    article.append(document.createElement('time'), document.createElement('h3'), document.createElement('p'));
    elements.programTimeline.append(article);
    items.push(article);
  }
  return items;
}

function renderProgram(invitation) {
  const items = ensureProgramItems(invitation.ceremonies.length);
  items.forEach((article, index) => {
    const ceremony = invitation.ceremonies[index];
    const language = state.language;
    const time = article.querySelector('time');
    time.textContent = ceremony.time;
    time.dateTime = ceremony.time;
    article.querySelector('h3').textContent = ceremony.title[language] || ceremony.title.ru;
    article.querySelector('p').textContent = ceremony.text[language] || ceremony.text.ru;
  });
  prepareReveal(elements.programTimeline);
  requestFlowerFrame();
}

function localizeVenueType(value) {
  if (state.language !== 'ky') return value;
  const known = { 'Банкетный зал': 'Банкеттик зал', 'Ресторан': 'Ресторан' };
  return known[value] || value;
}

function renderVenue(invitation) {
  elements.venueType.textContent = localizeVenueType(invitation.venue.type);
  elements.venueName.textContent = invitation.venue.name;
  elements.venueAddress.textContent = invitation.venue.address;
  const links = buildMapLinks(invitation.venue);
  elements.googleMapsLink.href = links.google;
  elements.twoGisLink.href = links.twoGis;
}

function renderMetadata(invitation) {
  const names = `${invitation.names.groom} ${translate('and')} ${invitation.names.bride}`;
  document.title = `${names} — ${translate('metaTitle')}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${translate('metaDescription')}: ${names}`);
  elements.heroNames.setAttribute('aria-label', names);
}

function renderInvitation(invitation) {
  state.invitation = invitation;
  elements.groomName.textContent = invitation.names.groom;
  elements.brideName.textContent = invitation.names.bride;
  elements.countdownNames.textContent = `${invitation.names.groom} ${translate('and')} ${invitation.names.bride}`;
  renderDate(invitation);
  renderProgram(invitation);
  renderVenue(invitation);
  renderMetadata(invitation);
  renderGuestList();
  updateCountdown();
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderGuestList() {
  if (!elements.guestSheetList) return;
  const guests = state.invitation?.guests || [];
  if (!guests.length) {
    elements.guestSheetList.replaceChildren(createElement('p', 'guest-sheet-empty', translate('emptyGuests')));
    return;
  }
  const cards = guests.map((guest) => {
    const card = createElement('article', 'guest-card');
    const top = createElement('div', 'guest-card-top');
    top.append(createElement('h3', '', guest.name));
    const status = createElement('span', guest.isAttending ? 'is-attending' : 'is-not-attending', guest.isAttending ? translate('attending') : translate('notAttending'));
    top.append(status);
    const count = createElement('p', 'guest-card-count', guestCountLabel(guest.guestsCount));
    card.append(top, count);
    if (guest.wish) card.append(createElement('p', 'guest-card-wish', guest.wish));
    return card;
  });
  elements.guestSheetList.replaceChildren(...cards);
}

function setLanguage(language, persist = true) {
  if (!['ru', 'ky'].includes(language)) return;
  state.language = language;
  if (persist) { try { localStorage.setItem('invitation-language', language); } catch {} }
  applyStaticTranslations();
  if (state.invitation) renderInvitation(state.invitation);
}

document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));

let revealObserver;
function prepareReveal(root = document) {
  const nodes = root.querySelectorAll('.reveal:not(.is-visible)');
  if (reducedMotion || !('IntersectionObserver' in window)) { nodes.forEach((node) => node.classList.add('is-visible')); return; }
  if (!revealObserver) revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  }), { threshold: 0.22 });
  nodes.forEach((node) => revealObserver.observe(node));
}

const timeline = elements.programTimeline;
const fallingFlower = elements.fallingFlower;
let flowerFrame = 0;
function placeFlower() {
  flowerFrame = 0;
  if (!timeline || !fallingFlower || reducedMotion) return;
  const rect = timeline.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.52 - rect.top) / rect.height));
  const travel = Math.max(0, timeline.clientHeight - fallingFlower.offsetHeight);
  fallingFlower.style.transform = `translate(-50%, ${progress * travel}px)`;
}
function requestFlowerFrame() { if (!flowerFrame) flowerFrame = requestAnimationFrame(placeFlower); }
if (!reducedMotion) {
  window.addEventListener('scroll', requestFlowerFrame, { passive: true });
  window.addEventListener('resize', requestFlowerFrame);
}

function updateCountdown() {
  if (!state.invitation) return;
  const remaining = Math.max(0, new Date(state.invitation.dateISO).getTime() - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000)
  };
  elements.countdownDays.textContent = String(values.days).padStart(3, '0');
  elements.countdownHours.textContent = String(values.hours).padStart(2, '0');
  elements.countdownMinutes.textContent = String(values.minutes).padStart(2, '0');
  elements.countdownSeconds.textContent = String(values.seconds).padStart(2, '0');
}
setInterval(updateCountdown, 1000);

function openGuestSheet() {
  state.lastFocus = document.activeElement;
  renderGuestList();
  elements.guestSheetBackdrop.hidden = false;
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => elements.guestSheetBackdrop.classList.add('is-open'));
  elements.openGuestSheet.setAttribute('aria-expanded', 'true');
  setTimeout(() => elements.closeGuestSheet.focus(), 180);
}

function closeGuestSheet() {
  elements.guestSheetBackdrop.classList.remove('is-open');
  document.body.classList.remove('sheet-open');
  elements.openGuestSheet.setAttribute('aria-expanded', 'false');
  setTimeout(() => { elements.guestSheetBackdrop.hidden = true; state.lastFocus?.focus?.(); }, reducedMotion ? 0 : 320);
}

elements.openGuestSheet.addEventListener('click', openGuestSheet);
elements.closeGuestSheet.addEventListener('click', closeGuestSheet);
elements.guestSheetBackdrop.addEventListener('click', (event) => { if (event.target === elements.guestSheetBackdrop) closeGuestSheet(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.guestSheetBackdrop.hidden) closeGuestSheet(); });

elements.rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.isSubmitting || !elements.rsvpForm.reportValidity()) return;
  const name = sanitizeText(elements.guestName.value, 120);
  const wish = sanitizeText(elements.guestWish.value, 600);
  const isAttending = elements.rsvpForm.elements.attending.value === 'yes';
  const guestsCount = Number.parseInt(elements.guestCount.value, 10) || 1;
  const guest = { name, wish, guestsCount, isAttending };

  state.isSubmitting = true;
  elements.rsvpSubmit.disabled = true;
  elements.rsvpSubmitText.textContent = translate('sending');
  state.rsvpStatusKey = '';
  elements.rsvpStatus.textContent = '';
  try {
    const result = await appendGuestToInvitation(state.id, guest);
    state.raw = result.raw;
    state.invitation = result.invitation;
    renderGuestList();
    state.rsvpStatusKey = 'submitSuccess';
    elements.rsvpStatus.textContent = translate(state.rsvpStatusKey);
    elements.rsvpForm.reset();
    elements.rsvpForm.elements.attending.value = 'yes';
    elements.guestCount.value = '1';
  } catch (error) {
    console.error(error);
    state.rsvpStatusKey = 'submitError';
    elements.rsvpStatus.textContent = translate(state.rsvpStatusKey);
  } finally {
    state.isSubmitting = false;
    elements.rsvpSubmit.disabled = false;
    elements.rsvpSubmitText.textContent = translate('sendAnswer');
  }
});

async function loadInvitation() {
  setDataStatus('loading', 'loading');
  try {
    state.raw = await fetchInvitationRaw(state.id);
    state.source = 'api';
    clearDataStatus();
  } catch (apiError) {
    console.warn('API unavailable, using fallback content.', apiError);
    try {
      const fallbackUrl = new URL('./content.json', import.meta.url).href;
      state.raw = await fetchFallbackRaw(state.id, { url: fallbackUrl });
      state.source = 'fallback';
      setDataStatus('fallback', 'warning', 9000);
    } catch (fallbackError) {
      console.error(fallbackError);
      setDataStatus('fatal', 'error');
      return;
    }
  }
  document.body.dataset.dataSource = state.source;
  renderInvitation(normalizeInvitation(state.raw, state.id));
}

setupCloudIntro();
applyStaticTranslations();
prepareReveal();
requestFlowerFrame();
loadInvitation();
