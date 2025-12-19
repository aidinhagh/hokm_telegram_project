# Hokm Telegram Game

This repo contains:

- `hokm.html` — your Hokm game modified to work as a Telegram HTML5 Game.
- `index.js` — Node.js bot + Express server that receives game results and forwards them to you (admin) in Telegram.
- `package.json` — dependencies and start script.

## 1. How to use with Telegram Games

1. Create a bot with @BotFather and get the bot token.
2. Set up a *Game* with BotFather and point its **game URL** to the deployed `hokm.html` (for example from GitHub Pages or Render static site).
3. Deploy this Node.js app (index.js) to Render / your VPS.

### Environment variables

Set these:

- `BOT_TOKEN` — your bot token from BotFather.
- `ADMIN_CHAT_ID` — your own Telegram chat id (the admin that should receive results).

On Render, you can add them in the “Environment” section.

## 2. Local run

```bash
npm install
npm start
```

Server listens on `PORT` (default 3000).

## 3. Endpoint used by hokm.html

`hokm.html` calls:

```text
POST /hokm/result
Content-Type: application/json
```

with a payload like:

```json
{
  "userId": 123456789,
  "chatId": 123456789,
  "messageId": 42,
  "won": true,
  "tricksTeam": 7,
  "tricksEnemy": 3,
  "wallet": 120,
  "bet": 20
}
```

The server formats this and sends it to `ADMIN_CHAT_ID`.
