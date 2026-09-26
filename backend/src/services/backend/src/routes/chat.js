import { Router } from "express";
import {
  getOrCreateUser,
  getOrCreateActiveChat,
  createChat,
  listChats,
  deleteChat,
  getMessages,
  saveMessage,
  getMemory,
} from "../db/db.js";
import { generateReply, detectEmotion } from "../services/aiService.js";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, chatId, imageBase64 } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "`message` (string) is required." });
    }

    const user = await getOrCreateUser(req.telegramUser);
    const chat = await getOrCreateActiveChat(user.id, chatId);

    const history = await getMessages(user.id, chat.id, 20);
    const memoryFacts = await getMemory(user.id);

    await saveMessage(user.id, chat.id, "user", message);

    const replyText = await generateReply({
      history,
      memoryFacts,
      userMessage: message,
      imageBase64,
    });

    await saveMessage(user.id, chat.id, "assistant", replyText);

    res.json({
      reply: replyText,
      emotion: detectEmotion(replyText),
      chatId: chat.id,
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    res.status(500).json({ error: "JARVIS is temporarily unavailable." });
  }
});

router.get("/chats", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    const chats = await listChats(user.id);
    res.json({ chats });
  } catch (err) {
    console.error("[/api/chats]", err);
    res.status(500).json({ error: "Failed to load chats." });
  }
});

router.post("/chats", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    const chat = await createChat(user.id, req.body?.title || "New Chat");
    res.json({ chat });
  } catch (err) {
    console.error("[/api/chats POST]", err);
    res.status(500).json({ error: "Failed to create chat." });
  }
});

router.get("/chats/:id/messages", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    const messages = await getMessages(user.id, req.params.id, 100);
    res.json({ messages });
  } catch (err) {
    console.error("[/api/chats/:id/messages]", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

router.delete("/chats/:id", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    await deleteChat(user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[/api/chats/:id DELETE]", err);
    res.status(500).json({ error: "Failed to delete chat." });
  }
});

export default router;
