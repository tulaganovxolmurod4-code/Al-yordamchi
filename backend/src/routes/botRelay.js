import express from 'express';
import { getOrCreateUser, getOrCreateChat, saveMessage, getRecentMessages, getMemoryEntries } from '../db/db.js';
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
    const chat = await getOrCreateChat(user.id, 'telegram_dm');

    await saveMessage(chat.id, 'user', message);

    const history = await getRecentMessages(chat.id, 20);
    const memories = await getMemoryEntries(user.id);

    const replyText = await generateReply({
      history,
      memories,
      userMessage: message,
      userName: telegramUser?.first_name || 'do\'st',
    });

    await saveMessage(chat.id, 'assistant', replyText);

    const emotion = detectEmotion(replyText);

    res.json({ reply: replyText, emotion });
  } catch (err) {
    console.error('botRelay route error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
