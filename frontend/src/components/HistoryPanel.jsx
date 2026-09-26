import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function HistoryPanel({ onClose, onSelectChat, currentChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { chats } = await api.listChats();
    setChats(chats);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    await api.deleteChat(id);
    load();
  }

  return (
    <div className="panel-overlay">
      <div className="panel">
        <div className="panel-header">
          <h2>Chat History</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="panel-hint">Loading…</div>
        ) : chats.length === 0 ? (
          <div className="panel-hint">No previous chats yet.</div>
        ) : (
          <ul className="history-list">
            {chats.map((c) => (
              <li
                key={c.id}
                className={c.id === currentChatId ? "active" : ""}
                onClick={() => {
                  onSelectChat(c.id);
                  onClose();
                }}
              >
                <span>{c.title || "Untitled chat"}</span>
                <button className="icon-btn" onClick={(e) => handleDelete(c.id, e)} aria-label="Delete chat">🗑</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
