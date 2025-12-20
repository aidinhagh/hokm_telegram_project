const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || "0");
const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME || "hokmzombie";
const GAME_URL =
  process.env.GAME_URL ||
  "https://aidinhagh.github.io/hokm_telegram_project/hokm.html";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const app = express();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.use(bodyParser.json());

// CORS so GitHub Pages can POST to Render
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("Hokm Telegram Game bot is running.");
});

// Game result endpoint
app.post("/hokm/result", async (req, res) => {
  try {
    const {
      userId,
      chatId,
      messageId,
      won,
      tricksTeam,
      tricksEnemy,
      wallet,
      bet,
    } = req.body;

    const resultText = won ? "WIN ✅" : "LOSE ❌";

    const text =
      `🎮 Hokm Game Finished\n` +
      `👤 Player ID: ${userId || "unknown"}\n` +
      (chatId ? `💬 Chat ID: ${chatId}\n` : "") +
      (messageId ? `🧾 Message ID: ${messageId}\n` : "") +
      `📊 Result: ${resultText}\n` +
      `🎯 Tricks (Team vs Enemy): ${tricksTeam}-${tricksEnemy}\n` +
      `💰 Bet: $${bet}\n` +
      `👛 Wallet after game: $${wallet}`;

    if (ADMIN_CHAT_ID) {
      await bot.sendMessage(ADMIN_CHAT_ID, text);
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("Error in /hokm/result:", e);
    res.sendStatus(500);
  }
});

// /start or /hokm → send game
bot.onText(/\/start|\/hokm/, (msg) => {
  bot.sendGame(msg.chat.id, GAME_SHORT_NAME);
});

// When user taps Play → open GitHub Pages URL
bot.on("callback_query", (query) => {
  if (query.game_short_name === GAME_SHORT_NAME) {
    bot.answerCallbackQuery(query.id, {
      url: GAME_URL,
    });
  } else {
    bot.answerCallbackQuery(query.id, {
      text: "Unknown game.",
      show_alert: true,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on port", PORT));
