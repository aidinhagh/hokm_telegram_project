const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// ===== CONFIG =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || "0");

// from BotFather: /newgame → hokmzombie
const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME || "hokmzombie";

// where the HTML game lives (on Render)
const GAME_URL =
  process.env.GAME_URL ||
  "https://hokm_telegram_project.onrender.com/hokm.html";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

// ===== INIT =====
const app = express();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.use(bodyParser.json());

// 🔹 Serve all files in repo root (including hokm.html)
app.use(express.static(path.join(__dirname)));

// EXTRA safety: explicit route for hokm.html
app.get("/hokm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "hokm.html"));
});

// Health check
app.get("/", (req, res) => {
  res.send("Hokm Telegram Game bot is running.");
});

// Endpoint that the game calls at the end
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

// Send the game when user types /start or /hokm
bot.onText(/\/start|\/hokm/, (msg) => {
  bot.sendGame(msg.chat.id, GAME_SHORT_NAME);
});

// When user taps Play, give Telegram the URL
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

// Start HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});


