import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Search, FileText, Link2, Brain } from "lucide-react";
import { useObsidian } from "../hooks/useObsidian";

export default function KnowledgeGraph() {
  const { graph, isScanning, importFromFiles, searchVault } = useObsidian();
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
              className="flex-1 overflow-auto p-6"
            >
              <h2 className="text-lg font-light text-jarvis-blue text-glow mb-2">{selectedNote.name}</h2>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedNote.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-jarvis-blue/10 border border-jarvis-blue/20 text-[10px] font-mono text-jarvis-blue">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                {selectedNote.content}
              </div>
              {(selectedNote.links.length > 0 || selectedNote.backLinks.length > 0) && (
                <div className="mt-6 pt-4 border-t border-jarvis-blue-dim/10">
                  <div className="flex items-center gap-2 text-xs font-mono text-jarvis-blue-dim mb-2">
                    <Link2 className="w-3 h-3" />
                    CONNECTIONS
                  </div>
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
                </div>
              )}
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
