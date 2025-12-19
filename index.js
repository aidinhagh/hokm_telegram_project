const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// --- CONFIG ---
const BOT_TOKEN = process.env.BOT_TOKEN;               // your bot token
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || "0");
const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME || "hokmzombie"; // <-- from BotFather
const GAME_URL =
  process.env.GAME_URL ||
  "https://hokm_telegram_project.onrender.com/hokm.html"; // <-- where hokm.html will be

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

// --- INIT ---
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.use(bodyParser.json());

// 🔹 THIS LINE MAKES /hokm.html WORK
app.use(express.static(path.join(__dirname)));

// Simple health check on "/"
app.get("/", (req, res) => {
  res.send("Hokm Telegram Game bot is running.");
});

// Endpoint that hokm.html calls at the end of a game
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
  } catch (err) {
    console.error("Error in /hokm/result:", err);
    res.sendStatus(500);
  }
});

// When user sends /start or /hokm, send the game
bot.onText(/\/start|\/hokm/, (msg) => {
  bot.sendGame(msg.chat.id, GAME_SHORT_NAME);
});

// When user presses Play, provide the game URL
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

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});

