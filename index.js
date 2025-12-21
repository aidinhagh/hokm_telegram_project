import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// --- serve /public as website root ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// Optional: if Telegram opens "/" serve hokm.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "hokm.html"));
});

// --- your webhook endpoint ---
app.post("/hokm/result", async (req, res) => {
  try {
    const data = req.body;

    const token = process.env.BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (!token) return res.status(500).json({ ok: false, error: "Missing BOT_TOKEN" });
    if (!adminChatId) return res.status(500).json({ ok: false, error: "Missing ADMIN_CHAT_ID" });

    const text =
      `🎮 Hokm Result\n` +
      `User: ${data.firstName || ""} ${data.username ? "(@" + data.username + ")" : ""}\n` +
      `Won: ${data.won}\n` +
      `Score: ${data.tricksTeam} - ${data.tricksEnemy}\n` +
      `Bet: $${data.bet}\n` +
      `Wallet: $${data.wallet}\n` +
      `userId: ${data.userId || "?"}`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const tgResp = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: adminChatId, text }),
    });

    const tgJson = await tgResp.json();
    res.json({ ok: true, telegram: tgJson });
  } catch (err) {
    console.error("result handler error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server listening on", process.env.PORT || 10000);
});


