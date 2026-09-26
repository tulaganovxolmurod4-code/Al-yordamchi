export const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  ERROR: "error",
};

export const EMOTIONS = {
  NEUTRAL: "neutral",
  HAPPY: "happy",
  SAD: "sad",
  ANGRY: "angry",
  SURPRISED: "surprised",
};

export const STATE_COLORS = {
  [STATES.IDLE]: "#3fc8ff",
  [STATES.LISTENING]: "#37e0c9",
  [STATES.THINKING]: "#8a7bff",
  [STATES.SPEAKING]: "#3fc8ff",
  [STATES.ERROR]: "#ff5c5c",
};

export const EMOTION_COLORS = {
  [EMOTIONS.NEUTRAL]: "#3fc8ff",
  [EMOTIONS.HAPPY]: "#4dffb8",
  [EMOTIONS.SAD]: "#5b7fff",
  [EMOTIONS.ANGRY]: "#ff5c5c",
  [EMOTIONS.SURPRISED]: "#ffd23f",
};

export const STATE_LABELS = {
  [STATES.IDLE]: "",
  [STATES.LISTENING]: "Listening…",
  [STATES.THINKING]: "Thinking…",
  [STATES.SPEAKING]: "",
  [STATES.ERROR]: "Error",
};
