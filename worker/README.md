# Telegram notify worker

A tiny Cloudflare Worker: the site POSTs `{ "message": "..." }`, the worker sends it to your Telegram via your bot.
The bot token is stored as a Cloudflare secret and never appears in the public repo.

## Setup (once)

1. **Create a bot**: in Telegram open [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. **Let the bot write to you**: open your new bot and press **Start** (bots can't message first).
3. **Get your chat id**: open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser, find `"chat":{"id": 123456789`.
4. **Deploy** (from this folder):

   ```bash
   npx wrangler login
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   npx wrangler deploy
   ```

5. Put the printed `https://walk-invite-notify.<you>.workers.dev` URL into `notifyUrl` in `js/config.js`.

Only origins from `ALLOWED_ORIGINS` in `wrangler.jsonc` are accepted.
