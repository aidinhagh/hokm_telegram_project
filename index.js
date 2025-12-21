import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/hokm/result", async (req, res) => {
  try {
    const data = req.body;

    console.log("[/hokm/result] got:", data);

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
    console.log("[sendMessage]", tgJson);

    res.json({ ok: true, telegram: tgJson });
  } catch (err) {
    console.error("result handler error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server listening on", process.env.PORT || 10000);
});

