const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

// === CONFIG ===
// Put your bot token and admin chat id here or via environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "YOUR_ADMIN_CHAT_ID_HERE";

// Create bot (long polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Simple log when bot starts
bot.on("polling_error", (err) => console.error("Polling error:", err));
bot.on("message", (msg) => {
    console.log("Received message from", msg.from.id, ":", msg.text);
});

// Create HTTP server (for Telegram Game results)
const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.send("Hokm Telegram Game bot is running.");
});

// Endpoint that hokm.html calls with game result
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
            bet
        } = req.body || {};

        const resultText = won ? "WIN" : "LOSE";

        const text =
            `🎮 Hokm Game Finished\n` +
            `👤 Player ID: ${userId || "unknown"}\n` +
            (chatId ? `💬 Chat ID: ${chatId}\n` : "") +
            (messageId ? `🧾 Message ID: ${messageId}\n` : "") +
            `📊 Result: ${resultText}\n` +
            `🎯 Tricks (Team vs Enemy): ${tricksTeam}-${tricksEnemy}\n` +
            `💰 Bet: $${bet}\n` +
            `👛 Wallet after game: $${wallet}`;

        if (!ADMIN_CHAT_ID || ADMIN_CHAT_ID === "YOUR_ADMIN_CHAT_ID_HERE") {
            console.warn("ADMIN_CHAT_ID is not set. Cannot send result to admin.");
        } else {
            await bot.sendMessage(ADMIN_CHAT_ID, text);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("Error in /hokm/result:", err);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});
