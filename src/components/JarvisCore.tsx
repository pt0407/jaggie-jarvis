import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Settings, Square, Brain, VolumeX } from "lucide-react";
import { useAI } from "../hooks/useAI";
import { useVoice } from "../hooks/useVoice";
import ChatPanel from "./ChatPanel";
import VoiceVisualizer from "./VoiceVisualizer";
import KnowledgeGraph from "./KnowledgeGraph";
import SystemStatus from "./SystemStatus";
import SettingsPanel from "./SettingsPanel";

export default function JarvisCore() {
  const { messages, isLoading, streamContent, sendMessage, clearChat, stopGeneration } = useAI();
  const speakRef = useRef<((text: string) => void) | null>(null);
  const clearTranscriptRef = useRef<(() => void) | null>(null);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    const response = await sendMessage(text);
    if (response && localStorage.getItem("jarvis_voice") !== "false") {
      speakRef.current?.(response);
    }
  }, [isLoading, sendMessage]);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSpeaking,
    toggleListening,
    clearTranscript,
    speak,
    stopSpeaking,
  } = useVoice(useCallback((text: string) => {
    handleSend(text);
    clearTranscriptRef.current?.();
  }, [handleSend]));

  speakRef.current = speak;
  clearTranscriptRef.current = clearTranscript;

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge" | "status" | "settings">("chat");
  const [uptime, setUptime] = useState("00:00:00");
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sc = String(s % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${sc}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime]);


  return (
    <div className="relative w-screen h-screen bg-jarvis-bg circuit-pattern overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-jarvis-blue-dim blur-[150px] opacity-20" />
      </div>

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-jarvis-green animate-pulse" />
          <span className="text-jarvis-blue text-xs font-mono tracking-widest text-glow">
            JAGGIE JARVIS v2.0
          </span>
          <span className="text-jarvis-blue-dim text-xs font-mono">
            {isListening ? "● LISTENING" : isSpeaking ? "◈ SPEAKING" : "◉ STANDBY"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { id: "chat", icon: null, label: "CHAT" },
            { id: "knowledge", icon: Brain, label: "KNOWLEDGE" },
            { id: "status", icon: null, label: "SYSTEM" },
            { id: "settings", icon: Settings, label: "CONFIG" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-mono tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-jarvis-blue text-glow"
                  : "text-jarvis-blue-dim hover:text-jarvis-blue"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 pt-14 pb-4 px-4 flex gap-4">
        {/* Left panel - JARVIS Core */}
        <div className="w-1/3 flex flex-col items-center justify-center relative">
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex items-center justify-center"
            >
                {/* Outer rotating ring */}
                <div className="absolute w-[320px] h-[320px] rounded-full border border-jarvis-blue-dim jarvis-rotate opacity-30" />
                <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-jarvis-blue-dim jarvis-rotate opacity-20" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

                {/* Middle pulsing ring */}
                <div className="absolute w-[260px] h-[260px] rounded-full border-2 border-jarvis-blue jarvis-breathe opacity-40" />

                {/* Inner data ring */}
                <svg className="absolute w-[240px] h-[240px] jarvis-rotate" style={{ animationDuration: "15s" }} viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r="115" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="1" strokeDasharray="4 8" />
                </svg>

                {/* Core circle */}
                <div className="relative w-[200px] h-[200px] rounded-full bg-gradient-to-br from-jarvis-dark via-jarvis-bg to-black border border-jarvis-blue jarvis-ring flex items-center justify-center">
                  {/* Scan line */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-jarvis-blue to-transparent jarvis-scan opacity-60" />
                  </div>

                  {/* Center content */}
                  <div className="text-center z-10">
                    <div className="text-4xl font-light text-jarvis-blue text-glow mb-1">
                      {isListening ? "●" : isLoading ? "◐" : "◉"}
                    </div>
                    <div className="text-[10px] font-mono text-jarvis-blue-dim tracking-widest">
                      {isListening ? "LISTENING" : isLoading ? "PROCESSING" : "ONLINE"}
                    </div>
                  </div>

                  {/* Orbiting dots */}
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-jarvis-blue"
                      style={{
                        animation: `orbit ${6 + i * 2}s linear infinite`,
                        animationDelay: `${i * 2}s`,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
            </motion.div>
          </AnimatePresence>

          {/* Voice visualizer below core */}
          <div className="mt-8 w-full max-w-[280px]">
            <VoiceVisualizer isActive={isListening || isSpeaking} intensity={isSpeaking ? 0.7 : isListening ? 0.4 : 0.1} />
          </div>

          {/* Quick action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={toggleListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? "bg-jarvis-red border border-jarvis-red shadow-[0_0_20px_rgba(255,51,102,0.4)]"
                  : "bg-jarvis-dark border border-jarvis-blue hover:bg-jarvis-blue-dim"
              }`}
              title={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-jarvis-blue" />}
            </button>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="w-12 h-12 rounded-full bg-jarvis-orange/20 border border-jarvis-orange/50 flex items-center justify-center hover:bg-jarvis-orange/30 transition-all shadow-[0_0_15px_rgba(255,140,0,0.3)]"
                title="Stop speaking"
              >
                <VolumeX className="w-5 h-5 text-jarvis-orange" />
              </button>
            )}
            <button
              onClick={() => setActiveTab("settings")}
              className="w-12 h-12 rounded-full bg-jarvis-dark border border-jarvis-blue-dim flex items-center justify-center hover:border-jarvis-blue transition-colors"
            >
              <Settings className="w-5 h-5 text-jarvis-blue-dim" />
            </button>
          </div>
        </div>

        {/* Right panel - Content */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col min-h-0"
              >
                <ChatPanel messages={messages} isLoading={isLoading} streamContent={streamContent} onClear={clearChat} />
                <div className="p-3 border-t border-jarvis-blue-dim/20">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                      placeholder="Command Jaggie..."
                      className="flex-1 bg-jarvis-dark/50 border border-jarvis-blue-dim/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-jarvis-blue-dim/50 focus:outline-none focus:border-jarvis-blue/50 font-mono"
                    />
                    {isLoading ? (
                      <button
                        onClick={stopGeneration}
                        className="w-10 h-10 rounded-lg bg-jarvis-red/20 border border-jarvis-red/40 flex items-center justify-center hover:bg-jarvis-red/30 transition-all"
                        title="Stop generation"
                      >
                        <Square className="w-4 h-4 text-jarvis-red" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-lg bg-jarvis-blue/20 border border-jarvis-blue/30 flex items-center justify-center hover:bg-jarvis-blue/30 disabled:opacity-30 transition-all"
                      >
                        <Send className="w-4 h-4 text-jarvis-blue" />
                      </button>
                    )}
                  </div>
                  {isListening && (
                    <div className="mt-2 text-xs font-mono text-jarvis-blue-dim">
                      {transcript}
                      <span className="text-jarvis-blue/50">{interimTranscript}</span>
                      <span className="animate-pulse">▌</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "knowledge" && (
              <motion.div
                key="knowledge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <KnowledgeGraph />
              </motion.div>
            )}

            {activeTab === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto p-6"
              >
                <SystemStatus />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-auto p-6"
              >
                <SettingsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom info line */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <span className="text-[10px] font-mono text-jarvis-blue-dim/40 tracking-widest">
          NEURAL NETWORK ACTIVE • SYSTEM INTEGRITY 100% • UPTIME {uptime}
        </span>
      </div>
    </div>
  );
}
