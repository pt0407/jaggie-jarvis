import { useState, useCallback, useRef, useEffect } from "react";

export interface VoiceState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSpeaking: boolean;
  error: string | null;
}

const SILENCE_TIMEOUT_MS = 2000;

export function useVoice(onSilence?: (transcript: string) => void) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    isSpeaking: false,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef("");
  const onSilenceRef = useRef(onSilence);
  onSilenceRef.current = onSilence;

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          clearSilenceTimer();
          let interim = "";
          let finalChunk = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += t;
            } else {
              interim += t;
            }
          }
          if (finalChunk) {
            accumulatedRef.current += (accumulatedRef.current ? " " : "") + finalChunk.trim();
          }
          setState((prev) => ({
            ...prev,
            transcript: accumulatedRef.current,
            interimTranscript: interim,
          }));
          // Start silence timer after any speech activity
          if (finalChunk || interim) {
            silenceTimerRef.current = setTimeout(() => {
              const text = accumulatedRef.current.trim();
              if (text && onSilenceRef.current) {
                recognitionRef.current?.stop();
                onSilenceRef.current(text);
              }
            }, SILENCE_TIMEOUT_MS);
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error !== "aborted" && event.error !== "no-speech") {
            setState((prev) => ({ ...prev, error: event.error, isListening: false }));
          }
        };

        recognitionRef.current.onend = () => {
          clearSilenceTimer();
          setState((prev) => ({ ...prev, isListening: false, interimTranscript: "" }));
        };
      }

      synthRef.current = window.speechSynthesis;
    }
    return () => clearSilenceTimer();
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setState((prev) => ({ ...prev, error: "Speech recognition not supported" }));
      return;
    }
    try {
      accumulatedRef.current = "";
      recognitionRef.current.start();
      setState((prev) => ({ ...prev, isListening: true, transcript: "", error: null, interimTranscript: "" }));
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    accumulatedRef.current = "";
    setState((prev) => ({ ...prev, transcript: "", interimTranscript: "" }));
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9;
    utterance.onstart = () => setState((prev) => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => setState((prev) => ({ ...prev, isSpeaking: false }));
    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    speak,
    stopSpeaking,
  };
}
