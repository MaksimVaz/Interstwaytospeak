import { CONFIG } from './config.js';
import { createPlaceMap } from './map.js';
import {
  randomPositionAvoiding,
  noButtonLabel,
  yesButtonScale,
  formatDateLabel,
  formatMessage,
  telegramLink,
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

  input.addEventListener('input', () => {
    state.time = input.value || null;
    next.disabled = !state.time;
  });
}

/* Step 2: place */
function pickPlace(place) {
  state.place = place;
  $('[data-picked-place]').textContent = place.custom ? 'Вибрано твоє місце 💗' : `Вибрано: ${place.name}`;
  $('[data-screen="place"] [data-next]').disabled = false;
}

function placeText(place) {
  if (!place.custom) return place.name;
  const [lat, lng] = place.coords;
  return `точка на карті https://www.google.com/maps?q=${lat},${lng}`;
}

/* Final */
async function sendEmail(message) {
  if (!CONFIG.web3formsKey) return false;
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: CONFIG.web3formsKey, subject: 'Відповідь на запрошення 🍁', message }),
  });
  const result = await response.json();
  return response.ok && result.success === true;
}

function renderSummary() {
  const ticket = $('[data-summary]');
  ticket.replaceChildren();
  const rows = [
    ['Коли', `${dateLabel}, ${state.time}`],
    ['Де', state.place.custom ? 'твоє місце на карті' : state.place.name],
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
  const message = formatMessage({ dateLabel, time: state.time, place: placeText(state.place), wish: state.wish });

  renderSummary();
  show('done');
  dropLeaves();

  const tg = $('[data-telegram]');
  const link = telegramLink(CONFIG.telegramUsername, message);
  if (link) {
    tg.href = link;
    tg.hidden = false;
  }

  $('[data-copy]').onclick = async () => {
    await navigator.clipboard.writeText(message);
    $('[data-send-status]').textContent = 'Скопійовано — вставляй у чат 😉';
  };

  try {
    if (await sendEmail(message)) $('[data-send-status]').textContent = 'Я вже отримав твою відповідь 💌';
  } catch {
    // Telegram and copy buttons stay as a fallback
  }
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
