# CVP Discord Bot

A real Discord bot (not just a webhook) for **Capybaras vs Plants**. It reads live game data
from your existing CVP Notifier Railway API (`/api/status`) and:

- Answers slash commands on demand: `/eggshop`, `/gearshop`, `/merchant`, `/weather`, `/stock`
- Auto-posts a notification the moment an Egg Shop / Gear Shop item goes from **NO STOCK** to
  **in stock**, a new Traveling Merchant arrives, or the weather changes
- Lets server admins configure, per server:
  - which channel notifications go to (`/setchannel`)
  - which role gets pinged for each notification type (`/setrole`, `/clearrole`)
  - view current config (`/settings`)

This bot does **not** talk to the game directly — your existing Lua script keeps posting to
`POST /api/update` on your Railway service exactly as it already does. The bot only reads
`GET /api/status`.

## 1. Create the Discord bot

1. Go to https://discord.com/developers/applications → **New Application**
2. **Bot** tab → **Reset Token**, copy it → this is `DISCORD_BOT_TOKEN`
3. **General Information** tab → copy **Application ID** → this is `DISCORD_CLIENT_ID`
4. **OAuth2 → URL Generator**: check `bot` and `applications.commands` scopes, then under Bot
   Permissions check `Send Messages`, `Embed Links`, `Mention Everyone` (needed so role pings
   actually ping). Open the generated URL to invite the bot to your server.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_TEST_GUILD_ID=        # optional, your server ID for instant command testing
CVP_API_BASE_URL=https://cvp-notifier-production.up.railway.app
POLL_INTERVAL_MS=30000
```

**Never commit `.env` to GitHub** — it's already in `.gitignore`. On Railway, set these same
values under your service's **Variables** tab instead.

## 3. Install and register commands

```bash
npm install
npm run deploy-commands
```

Re-run `deploy-commands` any time you add/change a slash command. With `DISCORD_TEST_GUILD_ID`
set, commands appear instantly in that server; without it, global commands can take up to an
hour to show up everywhere.

## 4. Run locally / deploy to Railway

Locally:
```bash
npm start
```

On Railway: push this folder to a GitHub repo, create a new Railway service from that repo,
set the environment variables above in the Railway dashboard, and deploy. Railway auto-detects
`npm start` from `package.json`.

## 5. In Discord

Run once per server, by anyone with **Manage Server** permission:

```
/setchannel channel:#stock-alerts
/setrole event:Egg Shop role:@EggPing
/setrole event:Gear Shop role:@GearPing
/setrole event:Traveling Merchant role:@MerchantPing
/setrole event:Weather role:@WeatherPing
```

Roles are optional per event — skip `/setrole` for any type you don't want pinged.

## Data shape expected from `/api/status`

The bot is written defensively (it accepts a couple of reasonable variations), but the ideal
shape is:

```json
{
  "updatedAt": "2026-08-12T10:00:00Z",
  "eggShop": [
    { "name": "Capybara Egg", "rarity": "Common", "stock": "x4 In stock" },
    { "name": "Golem Capybara Egg", "rarity": "Divine", "stock": "NO STOCK" }
  ],
  "gearShop": [
    { "name": "Hatch Hammer", "rarity": "Common", "stock": "x2 In stock" }
  ],
  "merchant": {
    "name": "Jester",
    "timeLeft": "1m 54s",
    "items": [
      { "name": "Gilded Hatch Hammer", "stock": "x1 In stock" }
    ]
  },
  "weather": "Rain"
}
```

If your actual `/api/status` response uses different field names, send me a sample response
and I'll adjust `normalizeStockList` / `normalizeMerchant` / `normalizeWeather` in `bot.js` to
match exactly — those three functions are the only place the shape assumptions live.

## Public / multi-server usage

The bot is already built to be added to any number of servers, not just yours:

- Every setting (`/setchannel`, `/setrole`) is stored **per Discord server** (keyed by guild ID
  in `db.json`), so one server's config never affects another's.
- `/setchannel` and `/setrole` require **Manage Server** permission, so random members in
  someone else's server can't hijack the notification setup.
- Every reply and every auto-notification includes two link buttons — **Add Bot to Your
  Server** (built from `DISCORD_CLIENT_ID` + the permission bits the bot needs) and
  **Capybaras vs Plants Wiki** (defaults to the community Fandom wiki; override with `WIKI_URL`
  in your `.env` if you'd rather point elsewhere) — so anyone who sees a notification can invite
  the bot to their own server in one click.

To let other people actually add it, just share the invite link (or let them click the button
on any message) — no extra setup needed on your end.

## Anti-spam behavior

The poller only fires a notification on a **state transition**:
- Egg/Gear item: `NO STOCK` → in stock (not on every poll while it's still in stock)
- Merchant: new merchant name appears (not repeated while the same merchant is still there)
- Weather: any change from the previously seen weather

State is kept in memory, so a bot restart will treat the next poll as a fresh baseline (no
false notification storm, but also no notification for a stock change that happened while
the bot was offline).
