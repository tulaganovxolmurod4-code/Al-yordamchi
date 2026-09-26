import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function MemoryPanel({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { memory } = await api.getMemory();
      setEntries(memory);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!key.trim() || !value.trim()) return;
    setError("");
    try {
      await api.saveMemory(key.trim(), value.trim());
      setKey("");
      setValue("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteMemory(id);
    load();
  }

  return (
    <div className="panel-overlay">
      <div className="panel">
        <div className="panel-header">
          <h2>Memory</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <p className="panel-hint">
          What JARVIS remembers about you across conversations — your name, language, projects,
          preferences, and ongoing tasks. Never passwords, keys, or financial details.
        </p>

        <div className="memory-add-row">
          <input placeholder="key (e.g. name)" value={key} onChange={(e) => setKey(e.target.value)} />
          <input placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="pill-btn" onClick={handleAdd}>Add</button>
        </div>
        {error && <div className="error-text">{error}</div>}

        {loading ? (
          <div className="panel-hint">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="panel-hint">No memory saved yet.</div>
        ) : (
          <ul className="memory-list">
            {entries.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.key}</strong>
                  <span>{m.value}</span>
                </div>
                <button className="icon-btn" onClick={() => handleDelete(m.id)} aria-label="Delete">🗑</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
