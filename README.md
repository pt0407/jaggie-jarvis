# 🤖 Jaggie Jarvis

A 24/7 desktop AI agent inspired by Tony Stark's J.A.R.V.I.S. — runs on your Mac, learns everything about you, and has the ability to do anything.

![Jaggie Jarvis](https://img.shields.io/badge/Jaggie-Jarvis-00d4ff?style=for-the-badge&logo=react&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## Features

- **🧠 Neural Memory Graph** — Learns from every conversation, builds a persistent knowledge graph of you
- **💬 Streaming AI Chat** — Real-time streaming responses with full conversation history
- **🎤 Voice Transcription** — Speak naturally, JARVIS listens and responds (Web Speech API)
- **🗂 Obsidian Vault Integration** — Import your `.md` notes, index them, search and query
- **🔌 Multi-Provider BYOK** — Bring your own key for any provider:
  - [Hack Club AI](https://ai.hackclub.com) — free tier
  - [OpenAI](https://platform.openai.com) — GPT-4o, o1, o3
  - [Cerebras](https://cloud.cerebras.ai) — ultra-fast inference
  - [Groq](https://console.groq.com) — blazing fast
  - [OpenRouter](https://openrouter.ai) — 200+ models incl. Claude, Gemini
  - [Ollama](https://ollama.com) — fully local, no internet needed
- **📊 System Status** — Live CPU/memory/uptime dashboard
- **⚡ Tauri-ready** — Package as a native macOS `.dmg`

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:1420](http://localhost:1420)

## Configuration

Go to the **CONFIG** tab and:
1. Select your AI provider
2. Paste your API key (stored locally in your browser — never sent anywhere except the provider)
3. Pick your model
4. Optionally set your Obsidian vault path

## Building for macOS (Tauri)

```bash
# Prerequisites: Rust + Tauri CLI
cargo install tauri-cli

# Build native app
npm run tauri build
```

The `.dmg` will appear in `src-tauri/target/release/bundle/dmg/`.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS v4 + Framer Motion
- **Desktop**: Tauri v2 (Rust)
- **AI**: OpenAI-compatible streaming API (provider-agnostic)
- **Voice**: Web Speech API

## Privacy

All API keys and memory data are stored **locally in your browser's localStorage**. Nothing is sent to any server except your chosen AI provider.

## License

MIT
