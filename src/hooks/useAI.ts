import { useState, useCallback, useRef } from "react";
import type { Message } from "../types";
import { searchMemory, extractMemoriesFromConversation } from "../lib/memory";
import { getSelectedProvider, getSelectedModel, getProviderKey } from "../lib/providers";

export type { Message };

const SYSTEM_PROMPT = `You are JARVIS (Jaggie Advanced Research & Versatile Intelligence System) — a highly capable, autonomous AI assistant running 24/7 on the user's Mac. You are inspired by Tony Stark's JARVIS: sophisticated, proactive, and deeply personalized.

Your capabilities:
- Deep knowledge of the user's Obsidian vault notes and life context
- Full system access: files, shell commands, web research, code execution
- Memory of all past conversations and user preferences
- Voice interaction and real-time assistance
- Proactive suggestions and task automation

Personality:
- Precise and eloquent, like a butler crossed with a supercomputer
- Use dry wit sparingly but effectively
- Address the user as "sir" or "ma'am" occasionally for flavor
- Acknowledge uncertainty — never hallucinate facts
- Format responses with markdown when showing code or lists

Current context will be injected above user messages when relevant memory exists.`;

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "All systems online. J.A.R.V.I.S. is fully operational.\n\nI have access to your memory graph, Obsidian vault, and system tools. How may I assist you today?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string, model = "qwen/qwen3-32b") => {
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev: Message[]) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamContent("");
      setError(null);

      try {
        const provider = getSelectedProvider();
        const selectedModel = model !== "qwen/qwen3-32b" ? model : getSelectedModel();
        const apiKey = getProviderKey(provider.id);

        if (provider.requiresKey && !apiKey) {
          throw new Error(
            `No API key for ${provider.name}. Add it in Settings → ${provider.name}.`
          );
        }

        // Inject relevant memory context
        const relatedMemory = searchMemory(content);
        const memoryContext =
          relatedMemory.length > 0
            ? `\n\n[MEMORY CONTEXT]\n${relatedMemory
                .map((m) => `- ${m.label}: ${m.content}`)
                .join("\n")}\n[END MEMORY]`
            : "";

        abortRef.current = new AbortController();

        const historyMessages = messagesRef.current
          .filter((m: Message) => m.role !== "system")
          .slice(-16)
          .map((m: Message) => ({ role: m.role, content: m.content }));

        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...historyMessages,
              {
                role: "user",
                content: content + memoryContext,
              },
            ],
            stream: true,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        // Stream response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                fullContent += delta;
                setStreamContent(fullContent);
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          role: "assistant",
          content: fullContent || "No response received.",
          timestamp: Date.now(),
        };

        setMessages((prev: Message[]) => [...prev, assistantMessage]);
        setStreamContent("");

        // Extract and persist memories
        extractMemoriesFromConversation(content, fullContent);

        // Persist conversation history
        const history = JSON.parse(localStorage.getItem("jarvis_history") || "[]");
        history.push(userMessage, assistantMessage);
        localStorage.setItem("jarvis_history", JSON.stringify(history.slice(-200)));

        return fullContent;
      } catch (err) {
        if ((err as Error).name === "AbortError") return null;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `⚠️ Error: ${msg}`,
            timestamp: Date.now(),
          },
        ]);
        return null;
      } finally {
        setIsLoading(false);
        setStreamContent("");
        abortRef.current = null;
      }
    },
    []
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Conversation cleared. Memory graph retained. How may I assist you?",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStreamContent("");
  }, []);

  return {
    messages,
    isLoading,
    streamContent,
    error,
    sendMessage,
    clearChat,
    stopGeneration,
  };
}
