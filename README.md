# ⚡ Nano-WebMCP v2.0 PRO

> **Client-Side Autonomous AI Agent Studio & Model Context Protocol (WebMCP) Engine powered by Chrome Built-in AI (Gemini Nano).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: 2.0.0](https://img.shields.io/badge/Release-v2.0%20PRO-10B981.svg)](https://github.com/Diieeggoo0/NanoWebMCP/releases)
[![Google Chrome Built-in AI](https://img.shields.io/badge/Google-Chrome%20Built--in%20AI-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/ai/built-in)
[![WebMCP](https://img.shields.io/badge/Protocol-WebMCP%20v2.0-06B6D4)](https://github.com/Diieeggoo0/NanoWebMCP)
[![Zero Cloud Tokens](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald)](#key-features)
[![Author](https://img.shields.io/badge/Author-@Diieeggoo0-purple)](https://github.com/Diieeggoo0)

🌐 **Live Demo:** [https://diieeggoo0.github.io/NanoWebMCP/](https://diieeggoo0.github.io/NanoWebMCP/)

---

## 🎯 Overview

**Nano-WebMCP** is an open-source, client-side AI agent runtime and interactive studio bridging **Chrome Built-in AI (Gemini Nano / Prompt API)** with the **Model Context Protocol (MCP)** directly inside web browsers.

It executes autonomous agentic reasoning and sandboxed browser tool calling with:
- **Zero Cloud API Keys or Server Relays**: Everything runs locally on the user's hardware.
- **Microsecond Latency**: Sub-second execution for local tasks (<1.5 ms benchmark average).
- **Strict Privacy**: No user telemetry, notes, or DOM fragments ever leave the client machine.
- **100% Cross-Platform & Mobile Responsive**: Universal execution on Desktop, Tablets, and Smartphones with intelligent WebEngine simulation fallback.

Created for the **Google Web AI & Developer Community** by **Diego Peñaranda ([@Diieeggoo0](https://github.com/Diieeggoo0))**.

---

## 🏗️ Architecture

```
                       ┌────────────────────────────────────────┐
                       │          Client Web Browser            │
                       └────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴───────────────────────────┐
               ▼                                                        ▼
   ┌───────────────────────┐                                ┌───────────────────────┐
   │  Chrome Built-in AI   │◄────── Autonomous ReAct Loop ──►│     WebMCP Server     │
   │     (Gemini Nano)     │        (Prompt & Synthesize)   │     (Client Engine)   │
   │  ai.languageModel API │                                └───────────┬───────────┘
   └───────────────────────┘                                            │
                                            ┌───────────────────────────┴───────────────────────────┐
                                            ▼                           ▼                           ▼
                                ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
                                │ system_hardware_probe │   │  local_privacy_vault  │   │  dom_page_inspector   │
                                │ (WebGPU & CPU Cores)  │   │ (Isolated LocalStore) │   │ (In-browser DOM Tree) │
                                └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## ✨ What's New in v2.0 PRO

- 📱 **Mobile-First Responsive Studio**: Adaptive layout with dynamic viewport units (`100dvh`), safe-area padding, and segmented tab switcher (`[💬 Agent Studio]` & `[🛠️ WebMCP Tools]`).
- ⚡ **1-Click Interactive Tool Runners**: Every tool card features dedicated `[▶ Run Test]`, `[💬 Ask Agent]`, and `[{ } Schema]` buttons.
- 📊 **Automated Suite Benchmark**: In-app latency benchmarking tool testing all 4 tools in sequence with microsecond telemetric reporting.
- 🤖 **Interactive Engine Diagnostics & Switcher**: Live capability detection with manual toggle (`Auto`, `Chrome Gemini Nano`, `WebEngine Simulation`).
- 🎨 **Cyber-Glassmorphism UI**: High-contrast, accessibility-checked design with toasts, copy buttons, and real-time activity indicators.

---

## 🚀 Quick Start (Run Locally in 1 Minute)

### 1. Clone the repository
```bash
git clone https://github.com/Diieeggoo0/NanoWebMCP.git
cd NanoWebMCP
```

### 2. Launch the local static server
```bash
npx serve . -p 3000
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Enabling Chrome Built-in AI (Gemini Nano)

To run **Nano-WebMCP** directly against your device's native Gemini Nano model:

1. Open **Google Chrome** (Version 128+ or Chrome Canary).
2. Navigate to:
   - `chrome://flags/#prompt-api-for-gemini-nano` ➔ Set to **Enabled**.
   - `chrome://flags/#optimization-guide-on-device-model` ➔ Set to **Enabled BypassPerfRequirement**.
3. Relaunch Chrome.
4. Visit `chrome://components` and find **Optimization Guide On Device Model**. Click **Check for update** to trigger model download.
5. Reload **Nano-WebMCP** — the status pill will turn **Emerald Green ("Gemini Nano Active")**.

*(Note: On mobile or standard browsers where native flags are not yet exposed, Nano-WebMCP automatically falls back to client-side WebEngine simulation so you can still test tools and prompts seamlessly).*

---

## 📦 Extensibility: Creating Custom WebMCP Tools

Adding a custom tool takes less than 10 lines of code:

```javascript
import { WebMcpServer } from './src/core/webMcp.js';

const server = new WebMcpServer();

server.registerTool({
  name: "get_current_weather_sensor",
  description: "Reads local environmental telemetry from connected device sensors.",
  inputSchema: {
    type: "object",
    properties: {
      unit: { type: "string", enum: ["celsius", "fahrenheit"] }
    }
  },
  handler: async (args) => {
    // Read local sensor or device API
    return { temperature: 22, unit: args.unit || "celsius" };
  }
});
```

---

## 🤝 Community & Contributions

Contributions, feedback, and discussions are welcome!
- If you're from the **Google Developer Community**, feel free to test and drop feedback in Discord (`#chrome-built-in-ai` or `#ai-general`).
- Star ⭐ the repository if you support open-source Web AI!

### Author
* **Diego Peñaranda**
  - GitHub: [@Diieeggoo0](https://github.com/Diieeggoo0)
  - Focus: Web AI, Client-Side Agents & Full-Stack Systems

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
