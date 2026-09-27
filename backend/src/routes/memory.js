import express from 'express';
import { getOrCreateUser, getMemory, upsertMemory, deleteMemory } from '../db/db.js';

const router = express.Router();

// Get all memory entries for the current user
router.get('/', async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    const user = await getOrCreateUser(telegramUser);
    const memories = await getMemory(user.id);
    res.json({ memories });
  } catch (err) {
    console.error('memory GET error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Add or update a memory entry
router.post('/', async (req, res) => {
  try {
    const { key, value, category } = req.body;
    const telegramUser = req.telegramUser;

    if (!key || !value) {
      return res.status(400).json({ error: 'key and value are required' });
    }

    const user = await getOrCreateUser(telegramUser);

    let entry;
    try {
      entry = await upsertMemory(user.id, key, value, category || 'general');
    } catch (e) {
      if (e.code === 'FORBIDDEN_MEMORY') {
        return res.status(400).json({ error: 'content_blocked' });
      }
      throw e;
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
    await deleteMemory(user.id, id);
    res.json({ success: true });
  } catch (err) {
    console.error('memory DELETE error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
