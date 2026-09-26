import { useEffect, useRef, useState } from "react";
import RobotHead from "./components/RobotHead";
import ChatUI from "./components/ChatUI";
import StatusBar from "./components/StatusBar";
import MemoryPanel from "./components/MemoryPanel";
import HistoryPanel from "./components/HistoryPanel";
import { useVoice } from "./hooks/useVoice";
import { api } from "./services/api";
import { STATES, EMOTIONS } from "./state/jarvisState";

const LANG_MAP = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" };

export default function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [emotion, setEmotion] = useState(EMOTIONS.NEUTRAL);
  const [online, setOnline] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [showMemory, setShowMemory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [langCode, setLangCode] = useState("en");

  const voice = useVoice();
  const errorTimeout = useRef(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    const userLang = tg?.initDataUnsafe?.user?.language_code;
    if (userLang && LANG_MAP[userLang]) setLangCode(userLang);

    api
      .health()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  function pushMessage(role, content) {
    setMessages((prev) => [...prev, { role, content }]);
  }

  function showErrorState(message) {
    setState(STATES.ERROR);
    setEmotion(EMOTIONS.SAD);
    pushMessage("assistant", message);
    clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setState(STATES.IDLE), 4000);
  }

  async function handleSend(text, imageBase64) {
    if (!text && !imageBase64) return;
    pushMessage("user", text || "(image)");
    setState(STATES.THINKING);

    try {
      const { reply, emotion: replyEmotion, chatId: returnedChatId } = await api.sendMessage(
        text,
        chatId,
        imageBase64
      );
      if (!chatId) setChatId(returnedChatId);
      setOnline(true);
      pushMessage("assistant", reply);
      setEmotion(replyEmotion || EMOTIONS.NEUTRAL);
      setState(STATES.SPEAKING);
      voice.speak(reply, {
        lang: LANG_MAP[langCode] || "en-US",
        onEnd: () => setState(STATES.IDLE),
      });
    } catch (err) {
      setOnline(false);
      showErrorState(err.message || "JARVIS is temporarily unavailable.");
    }
  }

  function handleMicPress() {
    if (voice.isListening) {
      voice.stopListening();
      setState(STATES.IDLE);
      return;
    }
    if (!voice.isSttSupported) {
      showErrorState(
        "Voice input isn't supported in this app view. Try opening JARVIS in Chrome, or type your message."
      );
      return;
    }
    setState(STATES.LISTENING);
    voice.startListening({
      lang: LANG_MAP[langCode] || "en-US",
      onFinalResult: (text) => handleSend(text, null),
    });
  }

  async function handleNewChat() {
    const { chat } = await api.createChat();
    setChatId(chat.id);
    setMessages([]);
    setState(STATES.IDLE);
  }

  async function handleSelectChat(id) {
    setChatId(id);
    const { messages } = await api.getChatMessages(id);
    setMessages(messages.map((m) => ({ role: m.role, content: m.content })));
  }

  return (
    <div className="app-root">
      <StatusBar
        online={online}
        state={state}
        onOpenMemory={() => setShowMemory(true)}
        onOpenHistory={() => setShowHistory(true)}
        onNewChat={handleNewChat}
      />

      <div className="robot-stage">
        <RobotHead state={state} emotion={emotion} mouthVolume={voice.mouthVolume} />
      </div>

      <ChatUI
        messages={messages}
        onSend={handleSend}
        onMicPress={handleMicPress}
        isListening={voice.isListening}
        isSttSupported={voice.isSttSupported}
        transcript={voice.transcript}
        disabled={state === STATES.THINKING}
      />

      {showMemory && <MemoryPanel onClose={() => setShowMemory(false)} />}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onSelectChat={handleSelectChat}
          currentChatId={chatId}
        />
      )}
    </div>
  );
}
