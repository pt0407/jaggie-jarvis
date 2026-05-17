export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface MemoryNode {
  id: string;
  label: string;
  type: "fact" | "preference" | "task" | "vault" | "context";
  content: string;
  connections: string[];
  weight: number;
  createdAt: number;
  lastAccessed: number;
}

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  tags: string[];
  modified: number;
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  activeProcesses: number;
}

export type AgentTab = "chat" | "memory" | "vault" | "terminal" | "settings";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";
