# ⚡ Nano-WebMCP

> **Client-Side Autonomous AI Agent & Model Context Protocol (WebMCP) Engine powered by Chrome Built-in AI (Gemini Nano).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Google Chrome Built-in AI](https://img.shields.io/badge/Google-Chrome%20Built--in%20AI-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/ai/built-in)
[![WebMCP](https://img.shields.io/badge/Protocol-WebMCP%20v1.0-10B981)](https://github.com/Diieeggoo0/NanoWebMCP)
[![Zero Cloud Tokens](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald)](#key-features)
[![Author](https://img.shields.io/badge/Author-@Diieeggoo0-purple)](https://github.com/Diieeggoo0)

---

## 🎯 Overview

**Nano-WebMCP** is an open-source, client-side AI agent runtime designed to bridge **Chrome's Built-in AI (Gemini Nano / Prompt API)** with the **Model Context Protocol (MCP)** directly inside web browsers.

It executes autonomous agentic reasoning and sandboxed browser tool calling with:
- **Zero Cloud API Keys or Server Relays**: Everything runs locally on the user's hardware.
- **Zero Latency Overhead**: Sub-second execution for local tasks.
- **Strict Privacy**: No user telemetry, notes, or DOM fragments ever leave the client machine.

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

## ✨ Key Features

- **Standardized WebMCP Schema**: Compliant tool definitions (`name`, `description`, `inputSchema`, `handler`) ready for web agents.
- **Native Prompt API Support**: First-class integration with Chrome Canary/Dev `ai.languageModel` (Gemini Nano).
- **Graceful Fallback / Simulation Mode**: Works out of the box on standard browsers so anyone can test the WebMCP loop instantly.
- **Tool Calling Pipeline**: Automatic JSON plan detection, local invocation, and response synthesis streaming.
- **Modern Dark UI**: Designed with Google AI Studio & Vercel aesthetics for instant presentation.

---

## 🚀 Quick Start (Run Locally in 1 Minute)

### 1. Clone the repository
```bash
git clone https://github.com/Diieeggoo0/NanoWebMCP.git
cd NanoWebMCP
```

### 2. Launch the local static server
You can use any local server, or simply run:
```bash
npx serve . -p 3000
```
Open **`http://localhost:3000`** in Google Chrome.

---

## 🧪 Enabling Chrome Built-in AI (Gemini Nano)

To run **Nano-WebMCP** directly against your device's native Gemini Nano model:

1. Open **Google Chrome** (Version 128+ or Chrome Canary).
2. Navigate to:
   - `chrome://flags/#prompt-api-for-gemini-nano` ➔ Set to **Enabled**.
   - `chrome://flags/#optimization-guide-on-device-model` ➔ Set to **Enabled BypassPrefRequirement**.
3. Relaunch Chrome.
4. Visit `chrome://components` and find **Optimization Guide On Device Model**. Click **Check for update** to trigger model download.
5. Reload **Nano-WebMCP** — the status pill will turn **Emerald Green ("Gemini Nano Active")**.

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
