const BASE_URL = import.meta.env.VITE_BACKEND_URL;

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => fetch(`${BASE_URL}/health`).then((r) => r.json()),

  sendMessage: (message, chatId, imageBase64) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message, chatId, imageBase64 }) }),

  listChats: () => request("/api/chats"),
  createChat: (title) => request("/api/chats", { method: "POST", body: JSON.stringify({ title }) }),
  getChatMessages: (chatId) => request(`/api/chats/${chatId}/messages`),
  deleteChat: (chatId) => request(`/api/chats/${chatId}`, { method: "DELETE" }),

  getMemory: () => request("/api/memory"),
  saveMemory: (key, value, category) =>
    request("/api/memory", { method: "POST", body: JSON.stringify({ key, value, category }) }),
  deleteMemory: (id) => request(`/api/memory/${id}`, { method: "DELETE" }),
};
