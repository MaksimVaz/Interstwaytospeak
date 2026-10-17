import { CONFIG } from './config.js';
import { createPlaceMap } from './map.js';
import {
  randomPositionAvoiding,
  noButtonLabel,
  yesButtonScale,
  formatDateLabel,
  formatMessage,
  resolvePlace,
  placeMessageText,
  placeSummaryText,
  maskTime,
  normalizeTime,
  isValidTime,
} from './lib.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const state = { time: null, place: null, wish: '' };
const dateLabel = formatDateLabel(CONFIG.date);
let map = null;

function show(name) {
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen === name));
  window.scrollTo(0, 0);

  if (name === 'place') {
    map ??= createPlaceMap($('[data-map]'), { center: CONFIG.mapCenter, zoom: CONFIG.mapZoom, places: CONFIG.places }, pickPlace);
    // Leaflet measures the container, which was hidden until now
    requestAnimationFrame(() => map.invalidateSize());
  }
}

/* Step 0: the question with a runaway "No" */
function setupAsk() {
  const yes = $('[data-yes]');
  const no = $('[data-no]');
  let attempts = 0;
  let lastRunAt = 0;

  const runAway = (event) => {
    event.preventDefault();
    attempts += 1;
    lastRunAt = performance.now();
    if (!no.classList.contains('is-running')) {
      const { left, top } = no.getBoundingClientRect();
      no.style.left = `${left}px`;
      no.style.top = `${top}px`;
      no.classList.add('is-running');
    }
    no.textContent = noButtonLabel(attempts);
    yes.style.setProperty('--yes-scale', yesButtonScale(attempts));
    const { x, y } = randomPositionAvoiding(
      { width: window.innerWidth, height: window.innerHeight },
      { width: no.offsetWidth, height: no.offsetHeight },
      16,
      yes.getBoundingClientRect(),
    );
    no.style.left = `${x}px`;
    no.style.top = `${y}px`;
  };

  // Mouse users never reach it, touch users see it jump on tap, keyboard users too
  no.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && runAway(e));
  no.addEventListener('pointerdown', runAway);
  // A click right after pointerdown is the same tap; a lone click comes from the keyboard
  no.addEventListener('click', (e) => (performance.now() - lastRunAt < 500 ? e.preventDefault() : runAway(e)));

  yes.addEventListener('click', () => {
    // After a tap on "No" the browser fires click at the finger position, which may now be over "Yes"
    if (performance.now() - lastRunAt < 500) return;
    no.remove();
    show('time');
  });
}

/* Step 1: time */
function setupTime() {
  const input = $('[data-time]');
  const next = $('[data-screen="time"] [data-next]');

  const hint = $('[data-time-hint]');
  const defaultHint = hint.textContent;

  input.addEventListener('input', () => {
    input.value = maskTime(input.value);
    // At least two digits, so a single "1" does not silently become 01:00
    const enough = input.value.replace(/\D/g, '').length >= 2;
    const time = normalizeTime(input.value);
    state.time = enough && isValidTime(time) ? time : null;
    next.disabled = !state.time;
    hint.textContent = defaultHint;
    hint.classList.remove('is-error');
  });

  input.addEventListener('blur', () => {
    if (state.time) input.value = state.time;
    else if (input.value) {
      hint.textContent = 'Такого часу не буває 🙃 Спробуй, наприклад, 18:30';
      hint.classList.add('is-error');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.time) {
      input.value = state.time;
      show('place');
    }
  });
}

/* Step 2: place — map pick or typed text */
let mapPlace = null;

function updatePlace() {
  state.place = resolvePlace(mapPlace, $('[data-place-text]').value);
  let label = 'Місце ще не вибрано';
  if (state.place?.typed) label = `Вибрано: ${state.place.name} ✍️`;
  else if (state.place) label = state.place.custom ? 'Вибрано твоє місце 💗' : `Вибрано: ${state.place.name}`;
  $('[data-picked-place]').textContent = label;
  $('[data-screen="place"] [data-next]').disabled = !state.place;
}

function pickPlace(place) {
  mapPlace = place;
  updatePlace();
}

/* Final: the answer is sent automatically to Telegram (via the Railway server) and email */
async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  return response.ok && (result.ok === true || result.success === true);
}

async function deliver(message) {
  const jobs = [];
  if (CONFIG.notifyUrl) jobs.push(postJson(CONFIG.notifyUrl, { message }));
  if (CONFIG.web3formsKey) {
    jobs.push(postJson('https://api.web3forms.com/submit', {
      access_key: CONFIG.web3formsKey,
      subject: 'Відповідь на запрошення 🍁',
      message,
    }));
  }
  const results = await Promise.allSettled(jobs);
  return results.some((r) => r.status === 'fulfilled' && r.value === true);
}

function renderSummary() {
  const ticket = $('[data-summary]');
  ticket.replaceChildren();
  const rows = [
    ['Коли', `${dateLabel}, ${state.time}`],
    ['Де', placeSummaryText(state.place)],
  ];
  if (state.wish.trim()) rows.push(['Побажання', state.wish.trim()]);
  rows.forEach(([label, value]) => {
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.textContent = `${label}: `;
    p.append(span, value);
    ticket.append(p);
  });
}

async function finish() {
  state.wish = $('[data-wish]').value;
  const message = formatMessage({ dateLabel, time: state.time, place: placeMessageText(state.place), wish: state.wish });

  renderSummary();
  show('done');
  dropLeaves();

  const status = $('[data-send-status]');
  const retry = $('[data-retry]');

  const send = async () => {
    retry.hidden = true;
    status.textContent = 'Надсилаю відповідь…';
    if (await deliver(message)) {
      status.textContent = 'Я вже отримав твою відповідь 💌';
      return;
    }
    status.textContent = 'Відповідь не надіслалась — перевір інтернет і спробуй ще раз';
    retry.hidden = false;
  };

  retry.onclick = send;
  await send();
}

function dropLeaves() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('[data-leaves]');
  const emojis = ['🍁', '🍂', '💗'];
  for (let i = 0; i < 40; i += 1) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.textContent = emojis[i % emojis.length];
    leaf.style.left = `${Math.random() * 100}vw`;
    leaf.style.fontSize = `${1.2 + Math.random() * 1.6}rem`;
    leaf.style.animationDuration = `${4 + Math.random() * 4}s`;
    leaf.style.animationDelay = `${Math.random() * 2.5}s`;
    leaf.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}vw`);
    leaf.style.setProperty('--spin', `${(Math.random() - 0.5) * 720}deg`);
    leaf.addEventListener('animationend', () => leaf.remove());
    box.append(leaf);
  }
}

$$('[data-date-label]').forEach((el) => { el.textContent = dateLabel; });
$$('[data-next]').forEach((btn) => btn.addEventListener('click', () => show(btn.dataset.next)));
$('[data-finish]').addEventListener('click', finish);
setupAsk();
setupTime();
$('[data-place-text]').addEventListener('input', updatePlace);
