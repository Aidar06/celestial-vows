import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../dist');
for (const file of ['index.html','styles.css','app.js','assets/intro-clouds.png','assets/intro-clouds.mp4','assets/hero-doves.png','assets/floral-divider.png','assets/calendar-hall.png','assets/falling-peony.png','assets/program-venue-divider.png','assets/venue-rsvp-frame.png','assets/countdown-terrace.png']) {
  assert(fs.statSync(path.join(root, file)).size > 100, `Missing or empty: ${file}`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
for (const text of ['Дорогие родные и друзья','новая глава','С любовью, наши семьи']) assert(html.includes(text), `Missing copy: ${text}`);
for (const color of ['#F4EBDD','#9A87A8','#6F5B78','#D7C2A6','#B7C6D9','#C9B8B2']) assert(css.includes(color), `Missing palette color: ${color}`);
assert(html.includes('floral-transition'), 'Missing transition divider');
assert(html.includes('venue-rsvp-transition'), 'Missing venue to RSVP floral transition');
assert(html.includes('cloudIntro') && css.includes('cloud-intro.is-fading') && fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes("setTimeout(() => intro.classList.add('is-fading'), 3000)"), 'Missing timed cloud fade transition');
assert(html.includes('calendarDays') && html.includes('calendarMonth') && fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('firstDayOffset'), 'Missing dynamic wedding calendar');
for (const text of ['Встреча гостей','Церемония бракосочетания','Праздничный ужин','Музыка и танцы','Завершение вечера','Место встречи','Ала-Тоо']) assert(html.includes(text), `Missing section copy: ${text}`);
for (const text of ['Будете','Ваше имя','Вы сможете прийти?','Количество гостей','Пожелание молодожёнам']) assert(html.includes(text), `Missing RSVP copy: ${text}`);
for (const text of ['До нашей свадьбы осталось','countdownDays','countdownSeconds']) assert(html.includes(text), `Missing countdown: ${text}`);
assert(fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('placeFlower'), 'Missing scroll-linked flower animation');
assert(!fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('rotation'), 'Flower should fall without rotating');
assert(fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('updateCountdown'), 'Missing countdown timer logic');
assert(css.includes('rgba(255,255,255,.28)') && css.includes('backdrop-filter:blur(8px)'), 'Missing translucent blurred calendar card');
console.log('Passed: invitation sections, imagery, dynamic calendar, program animation, venue, RSVP and countdown.');
