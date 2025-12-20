
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || "0");
const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME || "hokm";
const GAME_URL =
  process.env.GAME_URL ||
  "https://hokm_telegram_project.onrender.com/hokm.html";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}
if (!ADMIN_CHAT_ID) {
  console.warn("WARNING: ADMIN_CHAT_ID is not set. Results will not be sent to admin.");
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(bodyParser.json());

// Serve static files (including hokm.html) from project root
app.use(express.static(path.join(__dirname)));

// Health check
app.get("/", (req, res) => {
  res.send("Hokm Telegram Game bot is running.");
});

// Endpoint that receives result from hokm.html and forwards to admin
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
    } = req.body || {};

    const resultText = won ? "WIN ✅" : "LOSE ❌";

    const lines = [
      "🎮 Hokm Game Finished",
      `👤 Player ID: ${userId || "unknown"}`,
    ];

    if (chatId) lines.push(`💬 Chat ID: ${chatId}`);
    if (messageId) lines.push(`🧾 Message ID: ${messageId}`);
    lines.push(
      `📊 Result: ${resultText}`,
      `🎯 Tricks (Team vs Enemy): ${tricksTeam}-${tricksEnemy}`,
      `💰 Bet: $${bet}`,
      `👛 Wallet after game: $${wallet}`
    );

    const text = lines.join("\n");

    if (ADMIN_CHAT_ID) {
      await bot.sendMessage(ADMIN_CHAT_ID, text);
    } else {
      console.log("ADMIN_CHAT_ID not set, result:\n" + text);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error in /hokm/result:", err);
    res.sendStatus(500);
  }
});

// When user sends /start or /hokm, send the game message
bot.onText(/\/start|\/hokm/, (msg) => {
  bot.sendGame(msg.chat.id, GAME_SHORT_NAME);
});

// When user presses "Play", provide the URL of the HTML game.
bot.on("callback_query", (query) => {
  try {
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
  } catch (e) {
    console.error("Error in callback_query handler:", e);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
