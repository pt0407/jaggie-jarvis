import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Bot, Trash2 } from "lucide-react";
import type { Message } from "../hooks/useAI";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  streamContent?: string;
  onClear: () => void;
}

export default function ChatPanel({ messages, isLoading, streamContent, onClear }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (!isNearBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamContent]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-jarvis-blue-dim/20">
        <span className="text-xs font-mono text-jarvis-blue-dim tracking-wider">COMMUNICATION LOG</span>
        <button
          onClick={onClear}
          className="text-jarvis-blue-dim/50 hover:text-jarvis-red transition-colors"
          title="Clear conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 select-text">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0.1 : 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-jarvis-blue/20 border border-jarvis-blue/30"
                  : "bg-jarvis-orange/20 border border-jarvis-orange/30"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-jarvis-blue" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-jarvis-orange" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-jarvis-blue/10 border border-jarvis-blue/20 text-white"
                  : "bg-jarvis-dark/50 border border-jarvis-blue-dim/10 text-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-jarvis-orange/20 border border-jarvis-orange/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-jarvis-orange" />
            </div>
            <div className="max-w-[80%] bg-jarvis-dark/50 border border-jarvis-blue-dim/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">
              {streamContent ? (
                <>
                  {streamContent}
                  <span className="inline-block w-0.5 h-3.5 bg-jarvis-blue ml-0.5 align-middle animate-pulse" />
                </>
              ) : (
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-jarvis-blue"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
