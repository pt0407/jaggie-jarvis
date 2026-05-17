import type { MemoryNode } from "../types";

const MEMORY_KEY = "jarvis_memory_graph";
const API_KEY_KEY = "jarvis_api_key";

export function getMemory(): MemoryNode[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMemory(nodes: MemoryNode[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(nodes));
}

export function addMemoryNode(
  node: Omit<MemoryNode, "id" | "createdAt" | "lastAccessed" | "connections" | "weight">
): MemoryNode {
  const nodes = getMemory();
  const newNode: MemoryNode = {
    ...node,
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    connections: [],
    weight: 1,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
  };

  // Auto-connect to related nodes by keyword overlap
  const words = newNode.content.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  for (const existing of nodes) {
    const existingWords = existing.content.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const overlap = words.filter((w) => existingWords.includes(w));
    if (overlap.length >= 2) {
      newNode.connections.push(existing.id);
      existing.connections.push(newNode.id);
      existing.weight += 0.1;
    }
  }

  nodes.push(newNode);
  saveMemory(nodes);
  return newNode;
}

export function updateNodeAccess(id: string) {
  const nodes = getMemory();
  const node = nodes.find((n) => n.id === id);
  if (node) {
    node.lastAccessed = Date.now();
    node.weight = Math.min(node.weight + 0.2, 10);
    saveMemory(nodes);
  }
}

export function searchMemory(query: string): MemoryNode[] {
  const nodes = getMemory();
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  return nodes
    .map((node) => {
      const text = (node.label + " " + node.content).toLowerCase();
      const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score * b.node.weight - a.score * a.node.weight)
    .slice(0, 5)
    .map(({ node }) => node);
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_KEY, key);
}

export function extractMemoriesFromConversation(userMsg: string, _aiMsg: string) {
  // Extract key facts and preferences from conversation
  const factPatterns = [
    /my name is (\w+)/i,
    /i (?:work|am) (?:at|a|an) (.+?)(?:\.|,|$)/i,
    /i (?:like|love|prefer|enjoy) (.+?)(?:\.|,|$)/i,
    /i (?:hate|dislike|don't like) (.+?)(?:\.|,|$)/i,
    /(?:my|the) (.+?) is (.+?)(?:\.|,|$)/i,
  ];

  for (const pattern of factPatterns) {
    const match = userMsg.match(pattern);
    if (match) {
      addMemoryNode({
        label: `User: ${match[0].slice(0, 50)}`,
        type: "fact",
        content: userMsg,
      });
      break;
    }
  }
}

export function getChatHistory(): { role: string; content: string }[] {
  try {
    const raw = localStorage.getItem("jarvis_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearChatHistory() {
  localStorage.removeItem("jarvis_history");
}
