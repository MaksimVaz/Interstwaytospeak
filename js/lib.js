// Pure helpers without DOM access — covered by tests/lib.test.js

const NO_LABELS = [
  'Ні',
  'Точно?',
  'Подумай ще 🙃',
  'Не-а, не спіймаєш',
  'Ну будь ласка 🥺',
  'Я тут не працюю',
  'Спробуй «Так»',
];

export function randomPosition(viewport, button, padding, rand = Math.random) {
  const maxX = viewport.width - button.width - padding;
  const maxY = viewport.height - button.height - padding;
  return {
    x: maxX > padding ? Math.round(padding + rand() * (maxX - padding)) : padding,
    y: maxY > padding ? Math.round(padding + rand() * (maxY - padding)) : padding,
  };
}

export function rectsOverlap(a, b, gap = 0) {
  return a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap;
}

// Tries a few random spots that do not cover `avoid` (the "Yes" button)
export function randomPositionAvoiding(viewport, button, padding, avoid, rand = Math.random, tries = 30) {
  let pos = randomPosition(viewport, button, padding, rand);
  for (let i = 1; i < tries && rectsOverlap({ ...pos, ...button }, avoid, 12); i += 1) {
    pos = randomPosition(viewport, button, padding, rand);
  }
  return pos;
}

export function noButtonLabel(attempt) {
  return NO_LABELS[attempt % NO_LABELS.length];
}

export function yesButtonScale(attempt) {
  return Math.min(1 + attempt * 0.12, 1.8);
}

export function formatDateLabel(isoDate) {
  // Noon avoids timezone shifts moving the date to a neighbouring day
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function formatMessage({ dateLabel, time, place, wish = '' }) {
  const lines = ['Я згодна на прогулянку! 🍁', `Коли: ${dateLabel}, ${time}`, `Де: ${place}`];
  const trimmedWish = wish.trim();
  if (trimmedWish) lines.push(`Побажання: ${trimmedWish}`);
  return lines.join('\n');
}

export function telegramLink(username, text) {
  const name = username.replace(/^@/, '').trim();
  if (!name) return null;
  return `https://t.me/${name}?text=${encodeURIComponent(text)}`;
}

// Typed text wins over the map pick, so she can always describe the spot in her own words
export function resolvePlace(mapPlace, typed) {
  const name = typed.trim();
  return name ? { name, typed: true } : mapPlace;
}

export function placeMessageText(place) {
  if (!place.custom) return place.name;
  const [lat, lng] = place.coords;
  return `точка на карті https://www.google.com/maps?q=${lat},${lng}`;
}

export function placeSummaryText(place) {
  return place.custom ? 'твоє місце на карті' : place.name;
}
