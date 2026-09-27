import express from 'express';
import { getOrCreateUser, getOrCreateActiveChat, saveMessage, getMessages, getMemory } from '../db/db.js';
import { generateReply, detectEmotion } from '../services/aiService.js';

const router = express.Router();

// Internal endpoint used by the Telegram bot to relay direct messages
router.post('/', async (req, res) => {
  try {
    const secret = req.headers['x-bot-secret'];
    if (!secret || secret !== process.env.BOT_INTERNAL_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { telegramUser, message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ error: 'telegramUser is required' });
    }

    const user = await getOrCreateUser(telegramUser);
    const chat = await getOrCreateActiveChat(user.id, null);

    await saveMessage(user.id, chat.id, 'user', message);

    const history = await getMessages(user.id, chat.id, 20);
    const memories = await getMemory(user.id);

    const replyText = await generateReply({
      history,
      memories,
      userMessage: message,
      userName: telegramUser?.first_name || 'do\'st',
    });

    await saveMessage(user.id, chat.id, 'assistant', replyText);

    const emotion = detectEmotion(replyText);

    res.json({ reply: replyText, emotion });
  } catch (err) {
    console.error('botRelay route error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
