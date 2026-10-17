# 🍁 walk-invite

A small interactive invitation for an autumn walk in Dnipro. The "No" button runs away, the "Yes" button grows, and the answer comes back to you via Telegram or email.

## Flow

1. **Question** — "Підеш зі мною на прогулянку?" The "No" button jumps to a random spot (never on top of "Yes") and changes its text.
2. **Time** — the date is fixed in config, she types the time on the keyboard (numeric keypad on phones, colon is added automatically).
3. **Place** — Leaflet + OpenStreetMap map with preset spots; a click anywhere else picks a custom place, or she can just type the place.
4. **Wish** — optional free text.
5. **Done** — summary ticket, falling leaves, "Send to Telegram" button with a pre-filled message.

## Stack

Vanilla HTML/CSS/ES modules, [Leaflet](https://leafletjs.com/) from CDN, Vitest for pure logic. No build step — deploys to GitHub Pages as is.

## Setup

Edit `js/config.js`:

| Field | What it does |
| --- | --- |
| `date` | Meeting date (ISO) |
| `telegramUsername` | Your username — the final button opens a chat with you |
| `web3formsKey` | Optional [Web3Forms](https://web3forms.com) key to also receive the answer by email |
| `places` | Map spots: name, note, `[lat, lng]` |

## Run locally

```bash
npm install
npm run dev     # static server
npm test        # unit tests
```

## Structure

```
index.html
css/style.css
js/config.js   # settings
js/lib.js      # pure helpers (tested)
js/map.js      # Leaflet map
js/app.js      # screens and DOM wiring
tests/lib.test.js
```
