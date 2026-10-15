/**
 * NanoAgent - High-Performance Client-Side Autonomous Agent Engine
 * Author: Diego Peñaranda (@Diieeggoo0)
 * 
 * Orchestrates Chrome Built-in AI (Gemini Nano) with WebMCP Tool Calling.
 * Fully responsive, cross-platform, with seamless fallback simulation on mobile devices.
 */

export class NanoAgent {
  constructor(mcpServer, options = {}) {
    this.mcpServer = mcpServer;
    this.systemPrompt = options.systemPrompt || 
      "You are NanoWebMCP, an autonomous client-side AI agent created by Diego Peñaranda (@Diieeggoo0). You run locally in the browser via Chrome Built-in AI (Gemini Nano) and WebMCP tool calling.";
    this.session = null;
    this.backend = "detecting"; // 'chrome-builtin', 'local-simulation'
    this.forcedMode = null; // null (auto), 'native', or 'simulation'
  }

  /**
   * Sets manual engine override (auto, native, simulation)
   */
  setEngineMode(mode) {
    this.forcedMode = mode;
    this.session = null;
    if (mode === "simulation") {
      this.backend = "local-simulation";
    }
  }

  /**
   * Probes Chrome Built-in AI (Prompt API) status with detailed diagnostic reporting
   */
  async checkCapabilities() {
    if (this.forcedMode === "simulation") {
      this.backend = "local-simulation";
      return {
        supported: true,
        status: "simulation_forced",
        model: "WebEngine Simulation (Active)",
        details: "Manual simulation mode selected. 100% on-device tool calling active.",
        isMobile: this._isMobileDevice()
      };
    }

    const isMobile = this._isMobileDevice();

    // Check modern Chrome 127+ AI API (window.ai.languageModel or self.ai.languageModel)
    const aiGlobal = typeof ai !== "undefined" ? ai : (typeof window !== "undefined" && window.ai ? window.ai : null);

    if (aiGlobal?.languageModel) {
      try {
        const capabilities = await aiGlobal.languageModel.capabilities();
        const available = capabilities.available; // 'readily', 'after-download', 'no'
        
        if (available === "readily" || available === "after-download") {
          this.backend = "chrome-builtin";
          return {
            supported: true,
            status: available,
            model: "Gemini Nano (On-Device)",
            details: `Native Prompt API active. Model availability: ${available}. Temperature: ${capabilities.defaultTemperature || 0.8}`,
            isMobile
          };
        }
      } catch (err) {
        console.warn("[NanoAgent] Error querying ai.languageModel:", err);
      }
    }

    // Check legacy window.ai
    if (typeof window !== "undefined" && window?.ai?.canCreateTextSession) {
      try {
        const status = await window.ai.canCreateTextSession();
        if (status === "readily") {
          this.backend = "chrome-builtin";
          return {
            supported: true,
            status,
            model: "Gemini Nano (Legacy API)",
            details: `Legacy session active (${status})`,
            isMobile
          };
        }
      } catch (err) {
        console.warn("[NanoAgent] Error checking window.ai legacy:", err);
      }
    }

    // High-performance fallback simulation (Universal Mobile & Non-Canary support)
    this.backend = "local-simulation";
    return {
      supported: false,
      status: isMobile ? "mobile_simulation" : "desktop_simulation",
      model: "WebEngine v2.0 (Local Sandbox)",
      details: isMobile 
        ? "Mobile browser detected. Client-Side WebMCP running in universal on-device simulation mode."
        : "Chrome Built-in AI flags not yet enabled. Running in ultra-fast local WebMCP simulation mode.",
      isMobile
    };
  }

  _isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (typeof window !== "undefined" && window.innerWidth < 800);
  }

  /**
   * Initializes a session with system instructions and tools schema
   */
  async initializeSession() {
    const toolsPrompt = this.mcpServer.getToolsSystemPrompt();
    const fullSystemPrompt = `${this.systemPrompt}\n\n${toolsPrompt}`;

    const aiGlobal = typeof ai !== "undefined" ? ai : (typeof window !== "undefined" && window.ai ? window.ai : null);

    if (this.backend === "chrome-builtin" && this.forcedMode !== "simulation" && aiGlobal?.languageModel) {
      try {
        this.session = await aiGlobal.languageModel.create({
          systemPrompt: fullSystemPrompt
        });
        console.log("[NanoAgent] Native Chrome Gemini Nano session created.");
        return;
      } catch (err) {
        console.warn("[NanoAgent] Failed to create native session, falling back:", err);
        this.backend = "local-simulation";
      }
    }

    // Fallback/simulation session
    this.session = {
      isMock: true,
      systemPrompt: fullSystemPrompt
    };
    console.log("[NanoAgent] Initialized local WebEngine session.");
  }

  /**
   * Runs an automated benchmark of all registered MCP tools and returns millisecond latency
   */
  async runBenchmark() {
    const results = [];
    const tools = this.mcpServer.listTools();

    for (const tool of tools) {
      const startTime = performance.now();
      let success = true;
      let error = null;

      try {
        let testArgs = {};
        if (tool.name === "system_hardware_probe") testArgs = { includeGpuDetails: true };
        else if (tool.name === "local_privacy_vault") testArgs = { operation: "list" };
        else if (tool.name === "math_safe_calc") testArgs = { expression: "Math.sqrt(256) * 10" };
        else if (tool.name === "dom_page_inspector") testArgs = { selector: "h1, h2, button" };

        await this.mcpServer.callTool(tool.name, testArgs);
      } catch (err) {
        success = false;
        error = err.message;
      }

      const durationMs = (performance.now() - startTime).toFixed(2);
      results.push({
        tool: tool.name,
        durationMs,
        success,
        error
      });
    }

    return results;
  }

  /**
   * Runs an agent task with streaming and tool-calling execution
   */
  async execute(userPrompt, callbacks = {}) {
    const { onStatus, onToolCall, onToken, onComplete } = callbacks;

    if (!this.session) {
      await this.initializeSession();
    }

    onStatus?.("Analyzing query intent & evaluating WebMCP tools...");

    // Real Chrome Built-in AI execution
    if (this.backend === "chrome-builtin" && !this.session.isMock) {
      return await this._executeNative(userPrompt, callbacks);
    }

    // High-performance intelligent simulation execution (Works on 100% of devices)
    return await this._executeSimulated(userPrompt, callbacks);
  }

  async _executeNative(userPrompt, callbacks) {
    const { onStatus, onToolCall, onToken, onComplete } = callbacks;

    try {
      onStatus?.("Prompting Gemini Nano on-device...");
      const response = await this.session.prompt(userPrompt);

      // Check if model called a tool via JSON
      const toolMatch = response.match(/```json\s*(\{[\s\S]*?"action":\s*"call_tool"[\s\S]*?\})\s*```/i);
      
      if (toolMatch) {
        const toolPayload = JSON.parse(toolMatch[1]);
        const toolName = toolPayload.tool;
        const toolArgs = toolPayload.arguments || {};

        onStatus?.(`Executing WebMCP tool: ${toolName}...`);
        onToolCall?.(toolName, toolArgs);

        const startTime = performance.now();
        const toolResult = await this.mcpServer.callTool(toolName, toolArgs);
        toolResult.latencyMs = (performance.now() - startTime).toFixed(2);

        onStatus?.("Synthesizing final response with tool results...");
        const finalPrompt = `Tool "${toolName}" executed with result: ${JSON.stringify(toolResult.data)}.\nProvide a comprehensive, user-friendly final answer.`;
        
        const stream = this.session.promptStreaming(finalPrompt);
        let accumulated = "";
        for await (const chunk of stream) {
          accumulated = chunk;
          onToken?.(chunk);
        }

        onComplete?.(accumulated, [toolResult]);
        return accumulated;
      }

      // No tool was needed
      onToken?.(response);
      onComplete?.(response, []);
      return response;
    } catch (err) {
      onStatus?.(`Error: ${err.message}`);
      throw err;
    }
  }

  async _executeSimulated(userPrompt, callbacks) {
    const { onStatus, onToolCall, onToken, onComplete } = callbacks;
    const lower = userPrompt.toLowerCase().trim();

    // Intent routing for demo showcasing WebMCP
    let chosenTool = null;
    let toolArgs = {};

    if (
      lower.includes("hardware") || lower.includes("gpu") || lower.includes("cpu") || 
      lower.includes("memory") || lower.includes("ram") || lower.includes("concurrency") ||
      lower.includes("specs") || lower.includes("device") || lower.includes("probe")
    ) {
      chosenTool = "system_hardware_probe";
      toolArgs = { includeGpuDetails: true };
    } else if (
      lower.includes("vault") || lower.includes("save") || lower.includes("secret") || 
      lower.includes("store") || lower.includes("private note") || lower.includes("password")
    ) {
      chosenTool = "local_privacy_vault";
      const keyName = "note_" + Date.now().toString().slice(-4);
      toolArgs = { operation: "save", key: keyName, value: userPrompt };
    } else if (
      lower.includes("calc") || lower.includes("math") || lower.includes("+") || 
      lower.includes("*") || lower.includes("/") || lower.includes("sqrt") || 
      lower.includes("square root") || lower.includes("plus") || lower.includes("minus")
    ) {
      chosenTool = "math_safe_calc";
      toolArgs = { expression: userPrompt };
    } else if (
      lower.includes("inspect") || lower.includes("dom") || lower.includes("headings") || 
      lower.includes("structure") || lower.includes("elements") || lower.includes("page")
    ) {
      chosenTool = "dom_page_inspector";
      toolArgs = { selector: "h1, h2, h3, button, a" };
    }

    const toolHistory = [];

    if (chosenTool) {
      onStatus?.(`Dispatching WebMCP tool: [${chosenTool}]...`);
      await new Promise(r => setTimeout(r, 350));

      const startTime = performance.now();
      onToolCall?.(chosenTool, toolArgs);
      
      const result = await this.mcpServer.callTool(chosenTool, toolArgs);
      result.latencyMs = (performance.now() - startTime).toFixed(2);
      toolHistory.push(result);

      onStatus?.(`Tool [${chosenTool}] completed in ${result.latencyMs}ms. Synthesizing response...`);
      await new Promise(r => setTimeout(r, 250));

      // Synthesize response safely
      let synthesisText = "";
      if (!result.success) {
        synthesisText = `⚠️ **WebMCP Execution Notice [${chosenTool}]**\n\nCould not execute tool safely: \`${result.error || "Unknown sandbox error"}\`.`;
      } else if (chosenTool === "system_hardware_probe") {
        synthesisText = `### 🔍 Client Hardware & WebGPU Telemetry\n\n` +
          `The local tool \`system_hardware_probe\` executed directly inside your browser sandbox:\n\n` +
          `- **WebGPU Acceleration:** ${result.data?.webGpuAvailable ? "🟢 **Available & Accelerated**" : "🟡 **Fallback / Standard Canvas**"}\n` +
          `- **GPU Architecture:** \`${result.data?.gpuInfo || "Hardware Adaptive"}\`\n` +
          `- **Logical CPU Cores:** \`${result.data?.concurrencyCores || "4"} threads\`\n` +
          `- **Device Memory Estimate:** \`${result.data?.deviceMemoryGB || "Standard Browser Tier"} GB\`\n` +
          `- **Network Connectivity:** \`${result.data?.onlineStatus || "Online"}\`\n\n` +
          `🔒 *Execution Latency: **${result.latencyMs}ms** • Data sent to cloud: **0 bytes** (100% Client-Side).*`;
      } else if (chosenTool === "local_privacy_vault") {
        synthesisText = `### 🔒 Private Data Vault Committed\n\n` +
          `Your entry has been securely stored in the client-side sandboxed vault without touching any external servers:\n\n` +
          `- **Vault Key:** \`${result.data?.key}\`\n` +
          `- **Commit Timestamp:** \`${result.data?.timestamp}\`\n` +
          `- **Storage Medium:** Browser Local Storage Sandbox\n` +
          `- **Privacy Score:** \`100% Zero-Leak (No cloud API, no telemetry)\`\n\n` +
          `You can retrieve or list stored keys anytime using the \`local_privacy_vault\` tool.`;
      } else if (chosenTool === "math_safe_calc") {
        synthesisText = `### 🧮 Safe Math Calculation\n\n` +
          `- **Input Expression:** \`${result.data?.expression}\`\n` +
          `- **Normalized Formula:** \`${result.data?.normalized || result.data?.expression}\`\n` +
          `- **Evaluated Result:** **\`${result.data?.result}\`**\n` +
          `- **Execution Engine:** Float-64 Client Sandbox (No \`eval\`, safe Function parser)\n\n` +
          `Computed in **${result.latencyMs}ms** entirely on-device.`;
      } else {
        const itemsList = (result.data?.items || [])
          .slice(0, 5)
          .map(item => `  - \`<${item.tag}>\`: "${item.text.replace(/\n/g, ' ').slice(0, 45)}..."`)
          .join('\n');

        synthesisText = `### 📄 DOM & Web Page Structure Inspection\n\n` +
          `The \`dom_page_inspector\` tool queried the active document tree:\n\n` +
          `- **Document Title:** \`${result.data?.pageTitle || "NanoWebMCP"}\`\n` +
          `- **Elements Found:** **${result.data?.matchesFound || 0}** nodes\n` +
          `- **Sample Elements:**\n${itemsList || "  - No elements matching selector"}\n\n` +
          `Extracted client-side in **${result.latencyMs}ms**.`;
      }

      await this._streamText(synthesisText, onToken);
      onComplete?.(synthesisText, toolHistory);
      return synthesisText;
    }

    // Natural conversation about the project
    onStatus?.("Synthesizing client-side answer...");
    await new Promise(r => setTimeout(r, 200));

    let directAnswer = "";
    if (lower.includes("who are you") || lower.includes("what is this") || lower.includes("quien eres") || lower.includes("que es esto")) {
      directAnswer = `I am **Nano-WebMCP** (v2.0 Pro), an open-source client-side autonomous AI agent created by **Diego Peñaranda (@Diieeggoo0)**.\n\n` +
        `### 🚀 What makes this unique?\n` +
        `1. **On-Device Execution:** Designed for **Chrome Built-in AI** (Gemini Nano via the Prompt API) and universal WebEngine simulation.\n` +
        `2. **WebMCP Protocol:** Brings the **Model Context Protocol (MCP)** directly into the browser, enabling LLMs to call local JavaScript tools without cloud servers.\n` +
        `3. **100% Privacy:** Zero prompt data, telemetry, or hardware queries leave your machine.\n` +
        `4. **Universal Compatibility:** Works seamlessly on mobile devices, tablets, and desktop browsers.\n\n` +
        `Try clicking any of the **Quick Prompt chips** above, or test tools directly using the **[▶ Run Test]** buttons in the sidebar!`;
    } else if (lower.includes("mobile") || lower.includes("phone") || lower.includes("android") || lower.includes("ios") || lower.includes("iphone")) {
      directAnswer = `📱 **Mobile Optimization Status**\n\n` +
        `Nano-WebMCP is fully optimized for mobile devices with responsive layouts, touch-friendly navigation tabs, and adaptive client-side execution.\n\n` +
        `Since mobile browsers currently do not expose experimental desktop Chrome Canary flags, Nano-WebMCP automatically leverages its **Universal WebEngine** so you can benchmark all 4 WebMCP tools with sub-millisecond latencies right on your phone!`;
    } else if (lower.includes("tools") || lower.includes("mcp") || lower.includes("capabilities")) {
      directAnswer = `🛠️ **Registered WebMCP Tools Overview**\n\n` +
        `I have **4 sandboxed client tools** ready to execute:\n` +
        `- \`system_hardware_probe\`: Extracts WebGPU, logical cores, and memory.\n` +
        `- \`local_privacy_vault\`: Encrypted zero-cloud persistence in localStorage.\n` +
        `- \`math_safe_calc\`: Secure Float-64 calculation sandbox.\n` +
        `- \`dom_page_inspector\`: Real-time DOM element and heading extraction.\n\n` +
        `You can click **[▶ Run Test]** on any tool card in the left sidebar to execute it directly!`;
    } else {
      directAnswer = `I am **Nano-WebMCP**, running 100% locally in your browser. I have access to **4 client-side WebMCP tools**:\n\n` +
        `• 🔍 **Hardware & WebGPU** (\`system_hardware_probe\`)\n` +
        `• 🔒 **Private Vault** (\`local_privacy_vault\`)\n` +
        `• 🧮 **Safe Math Engine** (\`math_safe_calc\`)\n` +
        `• 📄 **DOM Inspector** (\`dom_page_inspector\`)\n\n` +
        `Try asking: *"Probe my hardware and WebGPU"*, *"Calculate sqrt(144 * 25) + 350"*, or click the quick chips above!`;
    }

    await this._streamText(directAnswer, onToken);
    onComplete?.(directAnswer, []);
    return directAnswer;
  }

  async _streamText(text, onToken) {
    let current = "";
    const words = text.split(" ");
    for (const word of words) {
      current += (current ? " " : "") + word;
      onToken?.(current);
      await new Promise(r => setTimeout(r, 20));
    }
  }
}
