import { Router } from "express";
import { getOrCreateUser, getOrCreateActiveChat, getMessages, saveMessage, getMemory } from "../db/db.js";
import { generateReply } from "../services/aiService.js";

const router = Router();

function requireBotSecret(req, res, next) {
  const secret = req.headers["x-bot-secret"];
  if (!secret || secret !== process.env.BOT_INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  next();
}

router.post("/bot/relay", requireBotSecret, async (req, res) => {
  try {
    const { telegramUser, message } = req.body;
    if (!telegramUser?.id || !message) {
      return res.status(400).json({ error: "telegramUser and message are required." });
    }

    const user = await getOrCreateUser(telegramUser);
    const chat = await getOrCreateActiveChat(user.id);
    const history = await getMessages(user.id, chat.id, 20);
    const memoryFacts = await getMemory(user.id);

    await saveMessage(user.id, chat.id, "user", message);
    const replyText = await generateReply({ history, memoryFacts, userMessage: message });
    await saveMessage(user.id, chat.id, "assistant", replyText);

    res.json({ reply: replyText });
  } catch (err) {
    console.error("[/api/bot/relay]", err);
    res.status(500).json({ error: "JARVIS is temporarily unavailable." });
  }
});

export default router;
