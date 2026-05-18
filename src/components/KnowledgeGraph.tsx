import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Search, FileText, Link2, Brain, Edit2, Save, X, Plus } from "lucide-react";
import { useObsidian } from "../hooks/useObsidian";

export default function KnowledgeGraph() {
  const { graph, isScanning, importFromFiles, searchVault, setGraph } = useObsidian();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  const renderContentWithLinks = useCallback((content: string): React.ReactNode => {
    const parts: (string | React.ReactNode)[] = [];
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const linkTarget = match[1].trim();
      const targetNode = graph.nodes.find((n) => n.id.toLowerCase() === linkTarget.toLowerCase());

      if (targetNode) {
        parts.push(
          <button
            key={`${match.index}-${linkTarget}`}
            onClick={() => setSelectedNode(targetNode.id)}
            className="px-1.5 py-0.5 rounded bg-jarvis-blue/10 border border-jarvis-blue/20 text-jarvis-blue hover:bg-jarvis-blue/20 hover:border-jarvis-blue/40 transition-colors text-xs font-mono"
          >
            {linkTarget}
          </button>
        );
      } else {
        // Link target not found, render as plain text
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  }, [graph.nodes]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredNodes = searchVault(searchQuery);
  const selectedNote = graph.nodes.find((n) => n.id === selectedNode);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        importFromFiles(e.target.files);
      }
    },
    [importFromFiles]
  );

  const handleEditStart = useCallback(() => {
    if (selectedNote) {
      setEditedContent(selectedNote.content);
      setIsEditing(true);
    }
  }, [selectedNote]);

  const handleSaveEdit = useCallback(() => {
    if (selectedNote) {
      const updatedNodes = graph.nodes.map((n) =>
        n.id === selectedNote.id
          ? {
              ...n,
              content: editedContent,
              wordCount: editedContent.split(/\s+/).length,
            }
          : n
      );
      setGraph({ ...graph, nodes: updatedNodes });
      localStorage.setItem("obsidian_vault_data", JSON.stringify({ ...graph, nodes: updatedNodes }));
      setIsEditing(false);
    }
  }, [selectedNote, editedContent, graph, setGraph]);

  const handleInsertWikiLink = useCallback((noteName: string) => {
    setEditedContent((prev) => prev + `[[${noteName}]]`);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent("");
  }, []);

  const handleCreateLink = useCallback((targetNoteId: string) => {
    if (selectedNote) {
      const targetNote = graph.nodes.find((n) => n.id === targetNoteId);
      if (!targetNote) return;

      // Add wikilink to current note's content
      const newContent = selectedNote.content.trim() + `\n[[${targetNote.name}]]`;
      const updatedNodes = graph.nodes.map((n) =>
        n.id === selectedNote.id
          ? {
              ...n,
              content: newContent,
              wordCount: newContent.split(/\s+/).length,
              links: [...new Set([...n.links, targetNote.name])],
            }
          : n.id === targetNoteId
          ? {
              ...targetNote,
              backLinks: [...new Set([...targetNote.backLinks, selectedNote.name])],
            }
          : n
      );
      setGraph({ ...graph, nodes: updatedNodes });
      localStorage.setItem("obsidian_vault_data", JSON.stringify({ ...graph, nodes: updatedNodes }));
      setShowLinkDropdown(false);
    }
  }, [selectedNote, graph, setGraph]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-jarvis-blue-dim/20">
        <span className="text-xs font-mono text-jarvis-blue-dim tracking-wider">NEURAL KNOWLEDGE NETWORK</span>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-mono text-jarvis-blue flex items-center gap-1 hover:text-jarvis-blue/70 transition-colors"
          >
            <Upload className="w-3 h-3" />
            IMPORT VAULT
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Search sidebar */}
        <div className="w-64 border-r border-jarvis-blue-dim/10 flex flex-col">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-jarvis-blue-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault..."
                className="w-full bg-jarvis-dark/50 border border-jarvis-blue-dim/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-jarvis-blue-dim/40 focus:outline-none focus:border-jarvis-blue/40 font-mono"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                  selectedNode === node.id
                    ? "bg-jarvis-blue/10 border border-jarvis-blue/30 text-jarvis-blue"
                    : "bg-jarvis-dark/30 border border-transparent text-gray-400 hover:bg-jarvis-dark/50 hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{node.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] opacity-50">
                  <span>{node.wordCount} words</span>
                  <span>{node.links.length} links</span>
                </div>
              </button>
            ))}
            {filteredNodes.length === 0 && !isScanning && (
              <div className="text-center text-jarvis-blue-dim/30 text-xs font-mono py-8">
                {searchQuery ? "No matches found" : "Import your Obsidian vault to begin"}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-jarvis-blue-dim/10">
                <h2 className="text-lg font-light text-jarvis-blue text-glow">{selectedNote.name}</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEditStart}
                    className="text-xs font-mono text-jarvis-blue flex items-center gap-1.5 hover:text-jarvis-blue/70 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    EDIT
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs font-mono text-jarvis-red flex items-center gap-1.5 hover:text-jarvis-red/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      CANCEL
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs font-mono text-jarvis-green flex items-center gap-1.5 hover:text-jarvis-green/70 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      SAVE
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-jarvis-blue/10 border border-jarvis-blue/20 text-[10px] font-mono text-jarvis-blue">
                      #{tag}
                    </span>
                  ))}
                </div>
                {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-64 bg-jarvis-dark/50 border border-jarvis-blue-dim/20 rounded-lg px-4 py-3 text-sm text-white placeholder-jarvis-blue-dim/30 focus:outline-none focus:border-jarvis-blue/40 font-mono resize-none"
                    placeholder="Write your note here... Use [[Note Name]] to create links."
                  />
                  <div>
                    <p className="text-xs font-mono text-jarvis-blue-dim mb-2 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      INSERT WIKILINK
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {graph.nodes
                        .filter((n) => n.id !== selectedNote.id)
                        .map((node) => (
                          <button
                            key={node.id}
                            onClick={() => handleInsertWikiLink(node.name)}
                            className="px-2 py-1 rounded bg-jarvis-dark/50 border border-jarvis-blue-dim/20 text-xs text-jarvis-blue hover:border-jarvis-blue/40 hover:bg-jarvis-blue/10 transition-colors"
                          >
                            {node.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {renderContentWithLinks(selectedNote.content)}
                </div>
              )}
              {!isEditing && (
                <div className="mt-6 pt-4 border-t border-jarvis-blue-dim/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-jarvis-blue-dim">
                      <Link2 className="w-3 h-3" />
                      CONNECTIONS
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                        className="text-xs font-mono text-jarvis-blue flex items-center gap-1.5 hover:text-jarvis-blue/70 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        CREATE LINK
                      </button>
                      {showLinkDropdown && (
                        <div className="absolute right-0 top-8 w-48 bg-jarvis-dark/95 border border-jarvis-blue-dim/30 rounded-lg shadow-xl z-10 max-h-48 overflow-auto">
                          {graph.nodes
                            .filter((n) => n.id !== selectedNote.id && !selectedNote.links.includes(n.name))
                            .map((node) => (
                              <button
                                key={node.id}
                                onClick={() => handleCreateLink(node.id)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-jarvis-blue/10 hover:text-jarvis-blue transition-colors"
                              >
                                {node.name}
                              </button>
                            ))}
                          {graph.nodes.filter((n) => n.id !== selectedNote.id && !selectedNote.links.includes(n.name)).length === 0 && (
                            <div className="px-3 py-2 text-xs text-jarvis-blue-dim/50">
                              No notes to link
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {(selectedNote.links.length > 0 || selectedNote.backLinks.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {[...selectedNote.links, ...selectedNote.backLinks].map((link) => (
                        <button
                          key={link}
                          onClick={() => setSelectedNode(link)}
                          className="px-2 py-1 rounded bg-jarvis-dark/50 border border-jarvis-blue-dim/20 text-xs text-jarvis-blue hover:border-jarvis-blue/40 transition-colors"
                        >
                          {link}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {isScanning ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-jarvis-blue border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-xs font-mono text-jarvis-blue-dim">SCANNING NEURAL PATHWAYS...</p>
                </div>
              ) : (
                <div className="text-center text-jarvis-blue-dim/30">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-mono">SELECT A NODE TO EXPLORE</p>
                  <p className="text-[10px] font-mono mt-1">Import your Obsidian .md files to build the network</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 border-t border-jarvis-blue-dim/10 flex gap-6 text-[10px] font-mono text-jarvis-blue-dim/50">
        <span>NODES: {graph.nodes.length}</span>
        <span>LINKS: {graph.links.length}</span>
        <span>TAGS: {new Set(graph.nodes.flatMap((n) => n.tags)).size}</span>
      </div>
    </div>
  );
}
