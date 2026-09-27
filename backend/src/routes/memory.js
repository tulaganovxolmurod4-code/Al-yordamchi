import express from 'express';
import { getOrCreateUser, getMemoryEntries, addMemoryEntry, deleteMemoryEntry } from '../db/db.js';

const router = express.Router();

// Get all memory entries for the current user
router.get('/', async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await getOrCreateUser(telegramUser);
    const memories = await getMemoryEntries(user.id);
    res.json({ memories });
  } catch (err) {
    console.error('memory GET error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Add a new memory entry
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const telegramUser = req.telegramUser;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const user = await getOrCreateUser(telegramUser);
    const entry = await addMemoryEntry(user.id, content);

    if (!entry) {
      return res.status(400).json({ error: 'content_blocked' });
    }

    res.json({ memory: entry });
  } catch (err) {
    console.error('memory POST error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Delete a memory entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const telegramUser = req.telegramUser;
    const user = await getOrCreateUser(telegramUser);
    await deleteMemoryEntry(user.id, id);
    res.json({ success: true });
  } catch (err) {
    console.error('memory DELETE error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
