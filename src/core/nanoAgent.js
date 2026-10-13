/**
 * NanoAgent - Client-Side Autonomous Agent Engine
 * Author: Diego Peñaranda (@Diieeggoo0)
 * 
 * Orchestrates Chrome Built-in AI (Gemini Nano) with WebMCP Tool Calling.
 */

export class NanoAgent {
  constructor(mcpServer, options = {}) {
    this.mcpServer = mcpServer;
    this.systemPrompt = options.systemPrompt || "You are an autonomous client-side AI agent running locally inside the user's browser via Gemini Nano.";
    this.session = null;
    this.backend = "detecting"; // 'chrome-builtin', 'cloud-gemini', or 'mock-simulation'
  }

  /**
   * Probes Chrome Built-in AI (Prompt API) status
   */
  async checkCapabilities() {
    // Check standard Chrome 127+ AI API
    if (typeof ai !== "undefined" && ai?.languageModel) {
      try {
        const capabilities = await ai.languageModel.capabilities();
        const available = capabilities.available; // 'readily', 'after-download', 'no'
        this.backend = available === "readily" || available === "after-download" ? "chrome-builtin" : "mock-simulation";
        return {
          supported: true,
          status: available,
          model: "Gemini Nano (On-Device)",
          details: `Availability: ${available}. Default Temperature: ${capabilities.defaultTemperature || 0.8}`
        };
      } catch (err) {
        console.warn("[NanoAgent] Error querying ai.languageModel:", err);
      }
    }

    // Check legacy window.ai
    if (typeof window !== "undefined" && window?.ai?.canCreateTextSession) {
      const status = await window.ai.canCreateTextSession();
      this.backend = status === "readily" ? "chrome-builtin" : "mock-simulation";
      return {
        supported: true,
        status,
        model: "Gemini Nano (Legacy window.ai)",
        details: `Session status: ${status}`
      };
    }

    this.backend = "mock-simulation";
    return {
      supported: false,
      status: "unsupported_browser",
      model: "Web Simulation Engine",
      details: "Chrome Built-in AI flag not enabled. Running in high-performance local simulation mode."
    };
  }

  /**
   * Initializes a session with system instructions and tools schema
   */
  async initializeSession() {
    const toolsPrompt = this.mcpServer.getToolsSystemPrompt();
    const fullSystemPrompt = `${this.systemPrompt}\n\n${toolsPrompt}`;

    if (this.backend === "chrome-builtin" && typeof ai !== "undefined" && ai?.languageModel) {
      try {
        this.session = await ai.languageModel.create({
          systemPrompt: fullSystemPrompt
        });
        console.log("[NanoAgent] Native Chrome Gemini Nano session created.");
        return;
      } catch (err) {
        console.warn("[NanoAgent] Failed to create native session, falling back:", err);
        this.backend = "mock-simulation";
      }
    }

    // Fallback/simulation session
    this.session = {
      isMock: true,
      systemPrompt: fullSystemPrompt
    };
    console.log("[NanoAgent] Initialized local runtime session.");
  }

  /**
   * Runs an agent task with streaming and tool-calling execution
   */
  async execute(userPrompt, callbacks = {}) {
    const { onStatus, onToolCall, onToken, onComplete } = callbacks;

    if (!this.session) {
      await this.initializeSession();
    }

    onStatus?.("Analyzing query and planning actions...");

    // Real Chrome Built-in AI execution
    if (this.backend === "chrome-builtin" && !this.session.isMock) {
      return await this._executeNative(userPrompt, callbacks);
    }

    // Local simulation / fallback execution
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

        const toolResult = await this.mcpServer.callTool(toolName, toolArgs);

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
    const lower = userPrompt.toLowerCase();

    // Intent routing for demo showcasing WebMCP
    let chosenTool = null;
    let toolArgs = {};

    if (lower.includes("hardware") || lower.includes("gpu") || lower.includes("system") || lower.includes("cpu")) {
      chosenTool = "system_hardware_probe";
      toolArgs = { includeGpuDetails: true };
    } else if (lower.includes("save") || lower.includes("store") || lower.includes("vault") || lower.includes("secret")) {
      chosenTool = "local_privacy_vault";
      const words = userPrompt.split(" ");
      toolArgs = { operation: "save", key: "note_" + Date.now().toString().slice(-4), value: userPrompt };
    } else if (lower.includes("calc") || lower.includes("math") || lower.includes("+") || lower.includes("*") || lower.includes("sqrt") || lower.includes("square root")) {
      chosenTool = "math_safe_calc";
      toolArgs = { expression: userPrompt };
    } else if (lower.includes("inspect") || lower.includes("dom") || lower.includes("page")) {
      chosenTool = "dom_page_inspector";
      toolArgs = { selector: "h1, h2, h3, button" };
    }

    const toolHistory = [];

    if (chosenTool) {
      onStatus?.(`Reasoning: user requested data requiring WebMCP tool [${chosenTool}]...`);
      await new Promise(r => setTimeout(r, 600));

      onToolCall?.(chosenTool, toolArgs);
      const result = await this.mcpServer.callTool(chosenTool, toolArgs);
      toolHistory.push(result);

      onStatus?.(`Tool [${chosenTool}] returned status ${result.success ? "200 OK" : "ERROR"}. Synthesizing client response...`);
      await new Promise(r => setTimeout(r, 500));

      // Synthesize response safely
      let synthesisText = "";
      if (!result.success) {
        synthesisText = `⚠️ **WebMCP Execution Notice [${chosenTool}]**\n\nCould not execute tool safely: \`${result.error || "Unknown sandbox error"}\`.`;
      } else if (chosenTool === "system_hardware_probe") {
        synthesisText = `**Hardware Analysis Report (100% Client-Side)**\n\n- **WebGPU Support:** ${result.data?.webGpuAvailable ? "✅ Hardware Accelerated" : "⚠️ Software/Fallback"}\n- **GPU Architecture:** \`${result.data?.gpuInfo || "Generic"}\`\n- **CPU Logical Cores:** \`${result.data?.concurrencyCores || "N/A"}\`\n- **Memory Estimate:** \`${result.data?.deviceMemoryGB || "N/A"} GB\`\n- **Network:** \`${result.data?.onlineStatus || "Online"}\`\n\n*All telemetry was extracted locally using the \`system_hardware_probe\` WebMCP tool with zero server calls.*`;
      } else if (chosenTool === "local_privacy_vault") {
        synthesisText = `🔒 **Private Data Vault Updated**\n\nYour data has been committed securely to local client storage:\n- **Key:** \`${result.data?.key}\`\n- **Timestamp:** \`${result.data?.timestamp}\`\n- **Cloud Transmission:** \`0 bytes (100% Isolated Sandbox)\``;
      } else if (chosenTool === "math_safe_calc") {
        synthesisText = `🧮 **Calculation Result**\n\n- **Expression:** \`${result.data?.expression}\`\n- **Normalized:** \`${result.data?.normalized || result.data?.expression}\`\n- **Result:** **\`${result.data?.result}\`**\n- **Precision:** Float-64 Safe Sandbox`;
      } else {
        synthesisText = `📄 **Page Inspection Complete**\n\nFound **${result.data?.matchesFound || 0}** elements matching query on \`${result.data?.pageTitle || "Document"}\`.`;
      }

      await this._streamText(synthesisText, onToken);
      onComplete?.(synthesisText, toolHistory);
      return synthesisText;
    }

    // Direct answer without tools
    onStatus?.("Generating direct on-device response...");
    await new Promise(r => setTimeout(r, 400));
    const responseText = `I am **Nano-WebMCP**, an autonomous client-side agent created by **@Diieeggoo0**.\n\nI can execute local browser actions with zero latency and complete privacy through the **Model Context Protocol (MCP)**. You can ask me to inspect your hardware, calculate equations, store private notes, or inspect web content!`;
    await this._streamText(responseText, onToken);
    onComplete?.(responseText, []);
    return responseText;
  }

  async _streamText(text, onToken) {
    let current = "";
    const words = text.split(" ");
    for (const word of words) {
      current += (current ? " " : "") + word;
      onToken?.(current);
      await new Promise(r => setTimeout(r, 25));
    }
  }
}
