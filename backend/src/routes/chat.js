import express from 'express';
import { getOrCreateUser, getOrCreateChat, saveMessage, getRecentMessages, getMemoryEntries } from '../db/db.js';
import { generateReply, detectEmotion } from '../services/aiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, chatType } = req.body;
    const telegramUser = req.telegramUser;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const user = await getOrCreateUser(telegramUser);
    const chat = await getOrCreateChat(user.id, chatType || 'miniapp');

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
    console.error('chat route error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
