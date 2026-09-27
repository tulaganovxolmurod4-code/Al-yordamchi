import express from 'express';
import { getOrCreateUser, getOrCreateActiveChat, saveMessage, getMessages, getMemory } from '../db/db.js';
import { generateReply, detectEmotion } from '../services/aiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const telegramUser = req.telegramUser;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const user = await getOrCreateUser(telegramUser);
    const chat = await getOrCreateActiveChat(user.id, chatId);

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

    res.json({ reply: replyText, emotion, chatId: chat.id });
  } catch (err) {
    console.error('chat route error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
