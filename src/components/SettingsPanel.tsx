import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, FolderOpen, Volume2, Eye, EyeOff, Save, ExternalLink, ChevronDown, Check, Folder } from "lucide-react";
import {
  PROVIDERS,
  getSelectedProvider,
  setSelectedProvider,
  getSelectedModel,
  setSelectedModel,
  getProviderKey,
  setProviderKey,
} from "../lib/providers";

export default function SettingsPanel() {
  const [activeProvider, setActiveProvider] = useState(getSelectedProvider().id);
  const [keys, setKeys] = useState<Record<string, string>>(() =>
    Object.fromEntries(PROVIDERS.map((p) => [p.id, getProviderKey(p.id)]))
  );
  const [models, setModels] = useState<Record<string, string>>(() =>
    Object.fromEntries(PROVIDERS.map((p) => [p.id, getSelectedModel(p.id)]))
  );
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [vaultPath, setVaultPath] = useState(localStorage.getItem("obsidian_vault_path") || "");
  const [voiceEnabled, setVoiceEnabled] = useState(localStorage.getItem("jarvis_voice") !== "false");
  const [saved, setSaved] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const path = (files[0] as any).webkitRelativePath || files[0].name;
      setVaultPath(path);
    }
  };

  const provider = PROVIDERS.find((p) => p.id === activeProvider) || PROVIDERS[0];

  const handleSave = () => {
    setSelectedProvider(activeProvider);
    PROVIDERS.forEach((p) => {
      if (keys[p.id]) setProviderKey(p.id, keys[p.id]);
      setSelectedModel(p.id, models[p.id] || p.defaultModel);
    });
    localStorage.setItem("obsidian_vault_path", vaultPath);
    localStorage.setItem("jarvis_voice", String(voiceEnabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls =
    "w-full bg-[rgba(0,10,20,0.6)] border border-jarvis-blue-dim/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-jarvis-blue-dim/30 focus:outline-none focus:border-jarvis-blue/50 font-mono transition-colors";

  return (
    <div className="space-y-6 max-w-lg pb-4">
      <h2 className="text-lg font-light text-jarvis-blue text-glow tracking-widest">
        SYSTEM CONFIGURATION
      </h2>

      {/* Provider Selector */}
      <div className="space-y-3">
        <label className="text-xs font-mono text-jarvis-blue-dim tracking-wider">
          AI PROVIDER (BYOK)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProvider(p.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-mono tracking-wide transition-all text-left ${
                activeProvider === p.id
                  ? "bg-jarvis-blue/15 border-jarvis-blue/50 text-jarvis-blue"
                  : "bg-jarvis-dark/40 border-jarvis-blue-dim/15 text-jarvis-blue-dim/60 hover:border-jarvis-blue-dim/40 hover:text-jarvis-blue-dim"
              }`}
            >
              {activeProvider === p.id && (
                <Check className="w-2.5 h-2.5 inline mr-1 mb-0.5" />
              )}
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Per-provider config */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProvider}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-4 bg-jarvis-dark/30 border border-jarvis-blue-dim/10 rounded-xl p-4"
        >
          {/* Key field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-jarvis-blue-dim tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3" />
                {provider.requiresKey ? "API KEY" : "NO KEY REQUIRED"}
              </label>
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-jarvis-blue-dim/40 hover:text-jarvis-blue flex items-center gap-1 transition-colors"
              >
                Get key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            {provider.requiresKey ? (
              <div className="relative">
                <input
                  type={showKeys[provider.id] ? "text" : "password"}
                  value={keys[provider.id] || ""}
                  onChange={(e) =>
                    setKeys((k) => ({ ...k, [provider.id]: e.target.value }))
                  }
                  placeholder={provider.keyPlaceholder}
                  className={inputCls + " pr-10"}
                />
                <button
                  onClick={() =>
                    setShowKeys((s) => ({ ...s, [provider.id]: !s[provider.id] }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jarvis-blue-dim/40 hover:text-jarvis-blue transition-colors"
                >
                  {showKeys[provider.id] ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-lg bg-jarvis-green/5 border border-jarvis-green/20 text-xs font-mono text-jarvis-green/60">
                Runs locally — no internet or key required
              </div>
            )}
            <p className="text-[10px] font-mono text-jarvis-blue-dim/35">{provider.keyHint}</p>
          </div>

          {/* Model picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-jarvis-blue-dim tracking-wider flex items-center gap-1.5">
              <ChevronDown className="w-3 h-3" />
              MODEL
            </label>
            <select
              value={models[provider.id] || provider.defaultModel}
              onChange={(e) =>
                setModels((m) => ({ ...m, [provider.id]: e.target.value }))
              }
              className={inputCls + " appearance-none cursor-pointer"}
            >
              {provider.models.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0a0a0f]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Vault Path */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-jarvis-blue-dim tracking-wider flex items-center gap-1.5">
          <FolderOpen className="w-3 h-3" />
          OBSIDIAN VAULT PATH
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            placeholder="/Users/you/Obsidian/MyVault"
            className={inputCls}
          />
          <button
            onClick={handleFolderSelect}
            className="px-3 rounded-lg bg-jarvis-dark/50 border border-jarvis-blue-dim/20 hover:border-jarvis-blue/40 hover:bg-jarvis-blue/10 transition-colors"
            title="Select vault folder"
          >
            <Folder className="w-4 h-4 text-jarvis-blue-dim" />
          </button>
        </div>
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          className="hidden"
          onChange={handleFolderChange}
        />
        <p className="text-[10px] font-mono text-jarvis-blue-dim/35">
          Used by the Knowledge tab to index your notes.
        </p>
      </div>

      {/* Voice Toggle */}
      <div className="flex items-center justify-between py-1">
        <label className="text-xs font-mono text-jarvis-blue-dim tracking-wider flex items-center gap-1.5">
          <Volume2 className="w-3 h-3" />
          VOICE RESPONSE
        </label>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            voiceEnabled
              ? "bg-jarvis-blue/40 border border-jarvis-blue/30"
              : "bg-jarvis-dark border border-jarvis-blue-dim/20"
          }`}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-jarvis-blue absolute top-0.5"
            animate={{ left: voiceEnabled ? "22px" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Save */}
      <motion.button
        onClick={handleSave}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-3 rounded-lg font-mono text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
          saved
            ? "bg-jarvis-green/20 border border-jarvis-green/40 text-jarvis-green"
            : "bg-jarvis-blue/15 border border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue/25"
        }`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "CONFIGURATION SAVED" : "SAVE CONFIGURATION"}
      </motion.button>

      <div className="pt-2 border-t border-jarvis-blue-dim/10 grid grid-cols-2 gap-x-4 gap-y-1">
        <p className="text-[10px] font-mono text-jarvis-blue-dim/25">JAGGIE JARVIS v2.0</p>
        <p className="text-[10px] font-mono text-jarvis-blue-dim/25">Vite + React + Tauri</p>
        <p className="text-[10px] font-mono text-jarvis-blue-dim/25">Neural Network: Active</p>
        <p className="text-[10px] font-mono text-jarvis-blue-dim/25">Voice: Web Speech API</p>
      </div>
    </div>
  );
}
