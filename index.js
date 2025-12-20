// index.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME || "hokmzombie";
const GAME_URL_BASE =
  process.env.GAME_URL ||
  "https://aidinhagh.github.io/hokm_telegram_project/hokm.html";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// CORS so GitHub Pages can talk to Render
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(bodyParser.json());

// Simple root
app.get("/", (req, res) => {
  res.send("Hokm Telegram backend is running.");
});

// Serve hokm.html from Render (for testing if you want)
app.get("/hokm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "hokm.html"));
});

// Game result endpoint
app.post("/hokm/result", async (req, res) => {
  console.log("Received /hokm/result payload:", req.body);

  const {
    userId,
    userName,
    won,
    tricksTeam,
    tricksEnemy,
    wallet,
    bet,
  } = req.body || {};

  // Always answer browser so it doesn’t hang
  res.sendStatus(200);

  if (!ADMIN_CHAT_ID) {
    console.error("ADMIN_CHAT_ID is not set; cannot notify admin.");
    return;
  }

  const resultText = won ? "WIN ✅" : "LOSS ❌";

  const text =
    "🎮 Hokm Game Finished\n" +
    `👤 Player ID: ${userId ?? "unknown"}\n` +
    (userName ? `📛 Player Name: ${userName}\n` : "") +
    `📊 Result: ${resultText}\n` +
    `🎯 Tricks (Team vs Enemy): ${tricksTeam ?? 0}-${tricksEnemy ?? 0}\n` +
    `💰 Bet: $${bet ?? 0}\n` +
    `👛 Wallet after game: $${wallet ?? 0}`;

  try {
    await bot.sendMessage(ADMIN_CHAT_ID, text);
    console.log("Result sent to admin:", ADMIN_CHAT_ID);
  } catch (err) {
    console.error("Failed to notify admin:", err.message);
  }
});

// /start or /hokm in private chat → send game button
bot.onText(/\/start|\/hokm/i, (msg) => {
  bot
    .sendGame(msg.chat.id, GAME_SHORT_NAME)
    .catch((err) => console.error("sendGame error:", err.message));
});

// When user taps the game button
bot.on("callback_query", (query) => {
  if (query.game_short_name !== GAME_SHORT_NAME) {
    bot
      .answerCallbackQuery(query.id, {
        text: "Unknown game.",
        show_alert: true,
      })
      .catch(() => {});
    return;
  }

  const u = query.from || {};
  const uid = u.id;
  const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
  const uname = fullName || u.username || "";

  // Add user info as query params so the game can read it reliably
  const url =
    GAME_URL_BASE +
    `?uid=${encodeURIComponent(uid)}&uname=${encodeURIComponent(uname)}`;

  bot
    .answerCallbackQuery(query.id, { url })
    .catch((err) =>
      console.error("answerCallbackQuery error:", err.message)
    );
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
