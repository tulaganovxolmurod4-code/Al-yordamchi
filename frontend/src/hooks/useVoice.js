import { useCallback, useEffect, useRef, useState } from "react";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthVolume, setMouthVolume] = useState(0);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef(null);
  const pseudoRafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const realRafRef = useRef(null);

  const isSttSupported =
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTtsSupported = typeof window !== "undefined" && !!window.speechSynthesis;

  useEffect(() => {
    if (!isSttSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, [isSttSupported]);

  const startListening = useCallback(
    ({ lang = "en-US", onFinalResult } = {}) => {
      const recognition = recognitionRef.current;
      if (!recognition) return;

      recognition.lang = lang;
      setTranscript("");

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += text;
          else interim += text;
        }
        setTranscript(final || interim);
        if (final) onFinalResult?.(final.trim());
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
    },
    []
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  function startPseudoMouthLoop() {
    let phase = 0;
    const loop = () => {
      phase += 0.35;
      const envelope = Math.max(0, Math.sin(phase) * 0.5 + Math.random() * 0.35);
      setMouthVolume(Math.min(1, envelope));
      pseudoRafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }
  function stopPseudoMouthLoop() {
    if (pseudoRafRef.current) cancelAnimationFrame(pseudoRafRef.current);
    pseudoRafRef.current = null;
    setMouthVolume(0);
  }

  const speak = useCallback(
    (text, { lang = "en-US", onEnd } = {}) => {
      if (!isTtsSupported || !text) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 0.9;

      utterance.onstart = () => {
        setIsSpeaking(true);
        startPseudoMouthLoop();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        stopPseudoMouthLoop();
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        stopPseudoMouthLoop();
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isTtsSupported]
  );

  const speakFromAudioUrl = useCallback((url, { onEnd } = {}) => {
    const audio = new Audio(url);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setMouthVolume(Math.min(1, avg / 128));
      realRafRef.current = requestAnimationFrame(loop);
    };

    audio.onplay = () => {
      setIsSpeaking(true);
      loop();
    };
    audio.onended = () => {
      setIsSpeaking(false);
      if (realRafRef.current) cancelAnimationFrame(realRafRef.current);
      setMouthVolume(0);
      onEnd?.();
    };

    audio.play();
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopPseudoMouthLoop();
    setIsSpeaking(false);
  }, []);

  return {
    isSttSupported,
    isTtsSupported,
    isListening,
    isSpeaking,
    mouthVolume,
    transcript,
    startListening,
    stopListening,
    speak,
    speakFromAudioUrl,
    stopSpeaking,
  };
    }
