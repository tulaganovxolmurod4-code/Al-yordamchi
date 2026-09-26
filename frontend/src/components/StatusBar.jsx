import { STATE_LABELS } from "../state/jarvisState";

export default function StatusBar({ online, state, onOpenMemory, onNewChat, onOpenHistory }) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${online ? "online" : "offline"}`} />
        <span className="status-text">JARVIS {online ? "Online" : "Offline"}</span>
      </div>
      <div className="status-center">{STATE_LABELS[state]}</div>
      <div className="status-right">
        <button className="pill-btn" onClick={onNewChat} title="New chat">New</button>
        <button className="pill-btn" onClick={onOpenHistory} title="Chat history">History</button>
        <button className="pill-btn" onClick={onOpenMemory} title="Memory">Memory</button>
      </div>
    </div>
  );
}
