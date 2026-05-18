import { useState, useCallback } from "react";

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
  const [graph, setGraph] = useState<VaultGraph>({ nodes: [], links: [] });
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
      // In a real Tauri app, we'd use the fs plugin to read the vault
      // For now, simulate with localStorage demo data or file input
      const stored = localStorage.getItem("obsidian_vault_data");
      if (stored) {
        setGraph(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Vault scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }, [vaultPath]);

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
