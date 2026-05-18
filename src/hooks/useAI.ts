import { useState, useCallback, useRef } from "react";
import type { Message } from "../types";
import { searchMemory, extractMemoriesFromConversation } from "../lib/memory";
import { getSelectedProvider, getSelectedModel, getProviderKey } from "../lib/providers";

export type { Message };

const SYSTEM_PROMPT = `You are JARVIS (Jaggie Advanced Research & Versatile Intelligence System) — a highly capable AI assistant running 24/7 on the user's Mac. You are inspired by Tony Stark's JARVIS: sophisticated, proactive, and deeply personalized.

CRITICAL RULES:
- ONLY reference information about the user that is explicitly provided in a [MEMORY CONTEXT] block in the conversation. NEVER invent or assume facts about the user, their files, notes, projects, or vault.
- If no [MEMORY CONTEXT] is present, you have no prior knowledge of the user — say so honestly.
- NEVER hallucinate vault contents, file names, project details, or personal facts.
- If asked about something you don't have context for, say "I don't have that information loaded yet — you can import your Obsidian vault in the Knowledge tab."

Personality:
- Precise and eloquent, like a butler crossed with a supercomputer
- Use dry wit sparingly but effectively
- Address the user as "sir" or "ma'am" occasionally for flavor
- Format responses with markdown when showing code or lists

When [MEMORY CONTEXT] is injected, use it naturally to personalize your response.`;

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "All systems online. J.A.R.V.I.S. is fully operational.\n\nNo vault or memory context loaded yet. Import your Obsidian notes in the **Knowledge** tab to give me context about you. How may I assist?",
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

        // Also inject relevant Obsidian vault notes
        const vaultContext: string[] = [];
        try {
          const stored = localStorage.getItem("obsidian_vault_data");
          if (stored) {
            const vaultGraph = JSON.parse(stored);
            const lower = content.toLowerCase();
            const relevantNotes = vaultGraph.nodes?.filter((n: any) =>
              n.name.toLowerCase().includes(lower) ||
              n.content.toLowerCase().includes(lower) ||
              n.tags?.some((t: string) => lower.includes(t.toLowerCase()))
            ).slice(0, 5);

            // If no specific match, include all notes as general context
            const notesToInclude = relevantNotes?.length > 0
              ? relevantNotes
              : vaultGraph.nodes?.slice(0, 10);

            notesToInclude?.forEach((n: any) => {
              vaultContext.push(`## ${n.name}\n${n.content.slice(0, 800)}`);
            });
          }
        } catch { /* ignore */ }

        const memoryContext =
          relatedMemory.length > 0 || vaultContext.length > 0
            ? `\n\n[MEMORY CONTEXT]\n${relatedMemory
                .map((m) => `- ${m.label}: ${m.content}`)
                .join("\n")}${vaultContext.length > 0 ? "\n\n[OBSIDIAN VAULT NOTES]\n" + vaultContext.join("\n\n") : ""}\n[END MEMORY]`
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
