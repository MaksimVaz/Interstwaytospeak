# Telegram notify server

A tiny dependency-free Node server: the site POSTs `{ "message": "..." }`, the server forwards it to your Telegram via your bot.
The bot token lives in environment variables and never appears in the public repo.

| Route | What it does |
| --- | --- |
| `POST /` | Sends `message` (1–1000 chars) to Telegram. Only origins from `ALLOWED_ORIGINS` |
| `GET /health` | Returns `ok` |

## Deploy on Railway

1. **New Project → Deploy from GitHub repo** → pick this repo.
2. **Root Directory** can stay empty — root `npm start` runs `server/index.js` (setting it to `/server` works too).
3. **Variables** tab — add the ones from `.env.example`:
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_CHAT_ID` — press **Start** in your bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `"chat":{"id": ...}`
   - `ALLOWED_ORIGINS` — `https://maksimvaz.github.io`
4. **Settings → Networking → Generate Domain**.
5. Put `https://<domain>.up.railway.app` into `notifyUrl` in `js/config.js`.

`PORT` is injected by Railway automatically.

## Run locally

```bash
cp .env.example .env   # fill in real values
npm run dev            # Node 20+, reads .env
```
