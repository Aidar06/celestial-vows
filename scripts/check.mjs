import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../dist');
for (const file of ['index.html','styles.css','app.js','assets/intro-clouds.webp','assets/intro-clouds-640.webp','assets/intro-clouds.mp4','assets/hero-doves.webp','assets/hero-doves-768.webp','assets/floral-divider.webp','assets/calendar-hall.webp','assets/falling-peony.webp','assets/program-venue-divider.webp','assets/venue-rsvp-frame.webp','assets/countdown-terrace.webp']) {
  assert(fs.statSync(path.join(root, file)).size > 100, `Missing or empty: ${file}`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
for (const text of ['Дорогие родные и друзья','новая глава','С любовью, наши семьи']) assert(html.includes(text), `Missing copy: ${text}`);
for (const color of ['#F4EBDD','#9A87A8','#6F5B78','#D7C2A6','#B7C6D9','#C9B8B2']) assert(css.includes(color), `Missing palette color: ${color}`);
assert(html.includes('floral-transition'), 'Missing transition divider');
assert(html.includes('venue-rsvp-transition'), 'Missing venue to RSVP floral transition');
assert(html.includes('cloudIntro') && css.includes('cloud-intro.is-fading') && fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes("later(() => intro.classList.add('is-fading'), 3000)"), 'Missing timed cloud fade transition');
assert(html.includes('calendarDays') && html.includes('calendarMonth') && fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('firstDayOffset'), 'Missing dynamic wedding calendar');
for (const text of ['Встреча гостей','Церемония бракосочетания','Праздничный ужин','Музыка и танцы','Завершение вечера','Место встречи','Ала-Тоо']) assert(html.includes(text), `Missing section copy: ${text}`);
for (const text of ['Будете','Ваше имя','Вы сможете прийти?','Количество гостей','Пожелание молодожёнам']) assert(html.includes(text), `Missing RSVP copy: ${text}`);
for (const text of ['До нашей свадьбы осталось','countdownDays','countdownSeconds']) assert(html.includes(text), `Missing countdown: ${text}`);
assert(fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('placeFlower'), 'Missing scroll-linked flower animation');
assert(!fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('rotation'), 'Flower should fall without rotating');
assert(/\.falling-flower\{[^}]*height:auto/.test(css), 'Falling flower must preserve its aspect ratio');
assert(fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('updateCountdown'), 'Missing countdown timer logic');
assert(css.includes('rgba(255,255,255,.28)') && css.includes('backdrop-filter:blur(8px)'), 'Missing translucent blurred calendar card');
assert(html.includes('preload="none"') && html.includes('data-src="assets/intro-clouds.mp4"'), 'Intro video must be deferred until interaction');
assert(html.includes('loading="lazy"') && fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('setupDeferredImages'), 'Missing deferred lower-page images');
for (const font of ['cormorant-regular.woff2','cormorant-italic.woff2','great-vibes.woff2','manrope-regular.woff2']) assert(css.includes(font), `Missing optimized font: ${font}`);
console.log('Passed: invitation sections, imagery, dynamic calendar, program animation, venue, RSVP and countdown.');
