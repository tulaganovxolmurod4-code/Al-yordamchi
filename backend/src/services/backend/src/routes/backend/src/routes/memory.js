import { Router } from "express";
import { getOrCreateUser, getMemory, upsertMemory, deleteMemory } from "../db/db.js";

const router = Router();

router.get("/memory", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    const memory = await getMemory(user.id);
    res.json({ memory });
  } catch (err) {
    console.error("[/api/memory GET]", err);
    res.status(500).json({ error: "Failed to load memory." });
  }
});

router.post("/memory", async (req, res) => {
  try {
    const { key, value, category } = req.body;
    if (!key || !value) return res.status(400).json({ error: "`key` and `value` are required." });

    const user = await getOrCreateUser(req.telegramUser);
    const entry = await upsertMemory(user.id, key, value, category);
    res.json({ entry });
  } catch (err) {
    if (err.code === "FORBIDDEN_MEMORY") {
      return res.status(400).json({ error: "That looks like a secret (password/key/token) — JARVIS won't store it." });
    }
    console.error("[/api/memory POST]", err);
    res.status(500).json({ error: "Failed to save memory." });
  }
});

router.delete("/memory/:id", async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    await deleteMemory(user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[/api/memory/:id DELETE]", err);
    res.status(500).json({ error: "Failed to delete memory entry." });
  }
});

export default router;
