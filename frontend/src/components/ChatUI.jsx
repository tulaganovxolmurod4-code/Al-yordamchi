import { useRef, useState } from "react";

export default function ChatUI({
  messages,
  onSend,
  onMicPress,
  isListening,
  isSttSupported,
  transcript,
  disabled,
}) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  function handleSend() {
    const value = text.trim();
    if (!value && !imageBase64) return;
    onSend(value, imageBase64);
    setText("");
    setImageBase64(null);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  return (
    <div className="chat-ui">
      <div className="message-list">
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble-${m.role}`}>
            {m.content}
          </div>
        ))}
        {isListening && <div className="bubble bubble-user bubble-interim">{transcript || "…"}</div>}
      </div>

      {imageBase64 && (
        <div className="attachment-preview">
          <img src={`data:image/jpeg;base64,${imageBase64}`} alt="attachment" />
          <button onClick={() => setImageBase64(null)} aria-label="Remove image">✕</button>
        </div>
      )}

      <div className="input-row">
        <button
          className="icon-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          title="Attach screenshot/image"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />

        <input
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message JARVIS…"
          disabled={disabled}
        />

        <button
          className={`icon-btn mic-btn ${isListening ? "mic-active" : ""}`}
          onClick={onMicPress}
          disabled={!isSttSupported || disabled}
          aria-label="Microphone"
          title={isSttSupported ? "Voice input" : "Voice input not supported in this browser"}
        >
          🎤
        </button>

        <button className="icon-btn send-btn" onClick={handleSend} disabled={disabled} aria-label="Send">
          ➤
        </button>
      </div>
    </div>
  );
}
