import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TauriMarkdownFile {
  name: string;
  path: string;
  content: string;
}

export interface VaultNode {
  id: string;
  name: string;
  path: string;
  content: string;
  tags: string[];
  links: string[];
  backLinks: string[];
  wordCount: number;
  lastModified: number;
}

export interface VaultLink {
  source: string;
  target: string;
  strength: number;
}

export interface VaultGraph {
  nodes: VaultNode[];
  links: VaultLink[];
}

export function useObsidian() {
  const [graph, setGraph] = useState<VaultGraph>(() => {
    try {
      const stored = localStorage.getItem("obsidian_vault_data");
      return stored ? JSON.parse(stored) : { nodes: [], links: [] };
    } catch {
      return { nodes: [], links: [] };
    }
  });
  const [isScanning, setIsScanning] = useState(false);
  const [vaultPath, setVaultPath] = useState(localStorage.getItem("obsidian_vault_path") || "");

  const extractWikiLinks = (content: string): string[] => {
    const links: string[] = [];
    const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      links.push(match[1].trim());
    }
    return links;
  };

  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    const regex = /#([a-zA-Z0-9_\-/]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  };

  const scanVault = useCallback(async () => {
    if (!vaultPath) return;
    setIsScanning(true);

    try {
      // Try Tauri command first (desktop app)
      if (window.__TAURI__) {
        const files = await invoke<TauriMarkdownFile[]>("scan_obsidian_vault", { vaultPath });
        
        const nodes: VaultNode[] = [];
        const linkMap = new Map<string, string[]>();

        files.forEach((file) => {
          const links = extractWikiLinks(file.content);
          const tags = extractTags(file.content);

          nodes.push({
            id: file.name,
            name: file.name,
            path: file.path,
            content: file.content,
            tags,
            links,
            backLinks: [],
            wordCount: file.content.split(/\s+/).length,
            lastModified: Date.now(),
          });

          linkMap.set(file.name, links);
        });

        // Build back-links
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        nodes.forEach((node) => {
          node.links.forEach((linkId) => {
            const target = nodeMap.get(linkId);
            if (target) {
              target.backLinks.push(node.id);
            }
          });
        });

        // Build graph links
        const links: VaultLink[] = [];
        nodes.forEach((node) => {
          node.links.forEach((linkId) => {
            if (nodeMap.has(linkId)) {
              links.push({
                source: node.id,
                target: linkId,
                strength: 1,
              });
            }
          });
        });

        const newGraph: VaultGraph = { nodes, links };
        setGraph(newGraph);
        localStorage.setItem("obsidian_vault_data", JSON.stringify(newGraph));
      } else {
        // Fallback to localStorage for web version
        const stored = localStorage.getItem("obsidian_vault_data");
        if (stored) {
          setGraph(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.error("Vault scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }, [vaultPath]);

  // Auto-scan vault when path changes
  useEffect(() => {
    if (vaultPath && window.__TAURI__) {
      scanVault();
    }
  }, [vaultPath, scanVault]);

  const importFromFiles = useCallback(async (files: FileList) => {
    setIsScanning(true);
    const nodes: VaultNode[] = [];
    const linkMap = new Map<string, string[]>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith(".md")) continue;

      const content = await file.text();
      const name = file.name.replace(".md", "");
      const links = extractWikiLinks(content);
      const tags = extractTags(content);

      nodes.push({
        id: name,
        name,
        path: file.name,
        content: content.slice(0, 5000),
        tags,
        links,
        backLinks: [],
        wordCount: content.split(/\s+/).length,
        lastModified: file.lastModified,
      });

      linkMap.set(name, links);
    }

    // Build back-links
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    nodes.forEach((node) => {
      node.links.forEach((linkId) => {
        const target = nodeMap.get(linkId);
        if (target) {
          target.backLinks.push(node.id);
        }
      });
    });

    // Build graph links
    const links: VaultLink[] = [];
    nodes.forEach((node) => {
      node.links.forEach((linkId) => {
        if (nodeMap.has(linkId)) {
          links.push({
            source: node.id,
            target: linkId,
            strength: 1,
          });
        }
      });
    });

    const graph: VaultGraph = { nodes, links };
    setGraph(graph);
    localStorage.setItem("obsidian_vault_data", JSON.stringify(graph));
    setIsScanning(false);
  }, []);

  const searchVault = useCallback(
    (query: string): VaultNode[] => {
      if (!query) return graph.nodes;
      const lower = query.toLowerCase();
      return graph.nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower) ||
          n.tags.some((t) => t.toLowerCase().includes(lower))
      );
    },
    [graph.nodes]
  );

  const getRelatedNotes = useCallback(
    (noteId: string): VaultNode[] => {
      const note = graph.nodes.find((n) => n.id === noteId);
      if (!note) return [];
      return graph.nodes.filter(
        (n) => note.links.includes(n.id) || note.backLinks.includes(n.id)
      );
    },
    [graph.nodes]
  );

  return {
    graph,
    setGraph,
    isScanning,
    vaultPath,
    setVaultPath,
    scanVault,
    importFromFiles,
    searchVault,
    getRelatedNotes,
  };
}
