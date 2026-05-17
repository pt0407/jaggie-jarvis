import { useState, useCallback, useRef, useEffect } from "react";

export interface VoiceState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSpeaking: boolean;
  error: string | null;
}

export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    isSpeaking: false,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

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
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          setState((prev) => ({
            ...prev,
            transcript: prev.transcript + final,
            interimTranscript: interim,
          }));
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error !== "aborted") {
            setState((prev) => ({ ...prev, error: event.error, isListening: false }));
          }
        };

        recognitionRef.current.onend = () => {
          setState((prev) => ({ ...prev, isListening: false }));
        };
      }

      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setState((prev) => ({ ...prev, error: "Speech recognition not supported" }));
      return;
    }
    try {
      recognitionRef.current.start();
      setState((prev) => ({ ...prev, isListening: true, error: null, interimTranscript: "" }));
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
