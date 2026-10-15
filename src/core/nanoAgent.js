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
    
    // Normalize diacritics and accents for robust multilingual intent matching
    const normalized = userPrompt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    // Detect user query language
    const isSpanish = /[áéíóúñ¿¡]|(quien|eres|hola|que|como|para|ayuda|calcula|calcular|boveda|guardar|herramienta|pagina|inspecciona|ejecuta|rendimiento|dispositivo|nucleo|memoria)/i.test(userPrompt);

    // Intent routing for demo showcasing WebMCP
    let chosenTool = null;
    let toolArgs = {};

    if (
      normalized.includes("hardware") || normalized.includes("gpu") || normalized.includes("cpu") || 
      normalized.includes("memory") || normalized.includes("ram") || normalized.includes("concurrency") ||
      normalized.includes("specs") || normalized.includes("device") || normalized.includes("probe") ||
      normalized.includes("nucleo") || normalized.includes("procesador") || normalized.includes("rendimiento") ||
      normalized.includes("grafica") || normalized.includes("probar")
    ) {
      chosenTool = "system_hardware_probe";
      toolArgs = { includeGpuDetails: true };
    } else if (
      normalized.includes("vault") || normalized.includes("save") || normalized.includes("secret") || 
      normalized.includes("store") || normalized.includes("private note") || normalized.includes("password") ||
      normalized.includes("boveda") || normalized.includes("guardar") || normalized.includes("secreto") ||
      normalized.includes("nota") || normalized.includes("clave") || normalized.includes("contrasena") ||
      normalized.includes("privad")
    ) {
      chosenTool = "local_privacy_vault";
      const keyName = "note_" + Date.now().toString().slice(-4);
      toolArgs = { operation: "save", key: keyName, value: userPrompt };
    } else if (
      normalized.includes("calc") || normalized.includes("math") || normalized.includes("+") || 
      normalized.includes("*") || normalized.includes("/") || normalized.includes("sqrt") || 
      normalized.includes("square root") || normalized.includes("plus") || normalized.includes("minus") ||
      normalized.includes("raiz") || normalized.includes("cuadrad") || normalized.includes("suma") ||
      normalized.includes("multiplic") || normalized.includes("divid") || normalized.includes("cuanto es")
    ) {
      chosenTool = "math_safe_calc";
      toolArgs = { expression: userPrompt };
    } else if (
      normalized.includes("inspect") || normalized.includes("dom") || normalized.includes("headings") || 
      normalized.includes("structure") || normalized.includes("elements") || normalized.includes("page") ||
      normalized.includes("inspeccion") || normalized.includes("encabezado") || normalized.includes("titulo") ||
      normalized.includes("pagina") || normalized.includes("botones")
    ) {
      chosenTool = "dom_page_inspector";
      toolArgs = { selector: "h1, h2, h3, button, a" };
    }

    const toolHistory = [];

    if (chosenTool) {
      onStatus?.(isSpanish ? `Ejecutando herramienta WebMCP: [${chosenTool}]...` : `Dispatching WebMCP tool: [${chosenTool}]...`);
      await new Promise(r => setTimeout(r, 300));

      const startTime = performance.now();
      onToolCall?.(chosenTool, toolArgs);
      
      const result = await this.mcpServer.callTool(chosenTool, toolArgs);
      result.latencyMs = (performance.now() - startTime).toFixed(2);
      toolHistory.push(result);

      onStatus?.(isSpanish ? `Herramienta [${chosenTool}] completada en ${result.latencyMs}ms. Sintetizando respuesta...` : `Tool [${chosenTool}] completed in ${result.latencyMs}ms. Synthesizing response...`);
      await new Promise(r => setTimeout(r, 200));

      // Synthesize response safely in the user's language
      let synthesisText = "";
      if (!result.success) {
        synthesisText = isSpanish 
          ? `⚠️ **Aviso de Ejecución WebMCP [${chosenTool}]**\n\nNo se pudo ejecutar la herramienta de forma segura: \`${result.error || "Error desconocido en el sandbox"}\`.`
          : `⚠️ **WebMCP Execution Notice [${chosenTool}]**\n\nCould not execute tool safely: \`${result.error || "Unknown sandbox error"}\`.`;
      } else if (chosenTool === "system_hardware_probe") {
        if (isSpanish) {
          synthesisText = `### 🔍 Telemetría de Hardware y WebGPU del Cliente\n\n` +
            `La herramienta local \`system_hardware_probe\` se ha ejecutado directamente en el sandbox de tu navegador:\n\n` +
            `- **Aceleración WebGPU:** ${result.data?.webGpuAvailable ? "🟢 **Disponible y Acelerada**" : "🟡 **Modo Canvas Estándar / Fallback**"}\n` +
            `- **Arquitectura GPU:** \`${result.data?.gpuInfo || "Hardware Adaptativo"}\`\n` +
            `- **Núcleos Lógicos de CPU:** \`${result.data?.concurrencyCores || "4"} hilos concurrentes\`\n` +
            `- **Memoria Estimada del Dispositivo:** \`${result.data?.deviceMemoryGB || "Estándar"} GB\`\n` +
            `- **Estado de Red:** \`${result.data?.onlineStatus === "Online" ? "Conectado" : "Desconectado"}\`\n\n` +
            `🔒 *Latencia de ejecución: **${result.latencyMs}ms** • Datos transmitidos a la nube: **0 bytes** (100% Client-Side).*`;
        } else {
          synthesisText = `### 🔍 Client Hardware & WebGPU Telemetry\n\n` +
            `The local tool \`system_hardware_probe\` executed directly inside your browser sandbox:\n\n` +
            `- **WebGPU Acceleration:** ${result.data?.webGpuAvailable ? "🟢 **Available & Accelerated**" : "🟡 **Fallback / Standard Canvas**"}\n` +
            `- **GPU Architecture:** \`${result.data?.gpuInfo || "Hardware Adaptive"}\`\n` +
            `- **Logical CPU Cores:** \`${result.data?.concurrencyCores || "4"} threads\`\n` +
            `- **Device Memory Estimate:** \`${result.data?.deviceMemoryGB || "Standard Browser Tier"} GB\`\n` +
            `- **Network Connectivity:** \`${result.data?.onlineStatus || "Online"}\`\n\n` +
            `🔒 *Execution Latency: **${result.latencyMs}ms** • Data sent to cloud: **0 bytes** (100% Client-Side).*`;
        }
      } else if (chosenTool === "local_privacy_vault") {
        if (isSpanish) {
          synthesisText = `### 🔒 Registro Guardado en la Bóveda Privada\n\n` +
            `Tu nota ha sido almacenada de forma segura en el almacenamiento local de tu navegador sin contactar servidores externos:\n\n` +
            `- **Clave de Entrada:** \`${result.data?.key}\`\n` +
            `- **Marca de Tiempo:** \`${result.data?.timestamp}\`\n` +
            `- **Medio de Almacenamiento:** Sandbox LocalStorage del Navegador\n` +
            `- **Nivel de Privacidad:** \`100% Cero Fugas (Sin APIs en la nube, sin telemetría)\`\n\n` +
            `Puedes consultar o listar tus registros guardados en cualquier momento mediante la herramienta \`local_privacy_vault\`.`;
        } else {
          synthesisText = `### 🔒 Private Data Vault Committed\n\n` +
            `Your entry has been securely stored in the client-side sandboxed vault without touching any external servers:\n\n` +
            `- **Vault Key:** \`${result.data?.key}\`\n` +
            `- **Commit Timestamp:** \`${result.data?.timestamp}\`\n` +
            `- **Storage Medium:** Browser Local Storage Sandbox\n` +
            `- **Privacy Score:** \`100% Zero-Leak (No cloud API, no telemetry)\`\n\n` +
            `You can retrieve or list stored keys anytime using the \`local_privacy_vault\` tool.`;
        }
      } else if (chosenTool === "math_safe_calc") {
        if (isSpanish) {
          synthesisText = `### 🧮 Cálculo Matemático Seguro\n\n` +
            `- **Expresión Original:** \`${result.data?.expression}\`\n` +
            `- **Fórmula Normalizada:** \`${result.data?.normalized || result.data?.expression}\`\n` +
            `- **Resultado Evaluado:** **\`${result.data?.result}\`**\n` +
            `- **Motor de Ejecución:** Sandbox numérico seguro Float-64 (sin \`eval\` arbitrario)\n\n` +
            `Calculado en **${result.latencyMs}ms** directamente en tu equipo.`;
        } else {
          synthesisText = `### 🧮 Safe Math Calculation\n\n` +
            `- **Input Expression:** \`${result.data?.expression}\`\n` +
            `- **Normalized Formula:** \`${result.data?.normalized || result.data?.expression}\`\n` +
            `- **Evaluated Result:** **\`${result.data?.result}\`**\n` +
            `- **Execution Engine:** Float-64 Client Sandbox (No \`eval\`, safe Function parser)\n\n` +
            `Computed in **${result.latencyMs}ms** entirely on-device.`;
        }
      } else {
        const itemsList = (result.data?.items || [])
          .slice(0, 5)
          .map(item => `  - \`<${item.tag}>\`: "${item.text.replace(/\n/g, ' ').slice(0, 45)}..."`)
          .join('\n');

        if (isSpanish) {
          synthesisText = `### 📄 Inspección del DOM y Estructura Web\n\n` +
            `La herramienta \`dom_page_inspector\` analizó los elementos del documento activo:\n\n` +
            `- **Título de la Página:** \`${result.data?.pageTitle || "NanoWebMCP"}\`\n` +
            `- **Nodos Encontrados:** **${result.data?.matchesFound || 0}** elementos\n` +
            `- **Muestra de Elementos:**\n${itemsList || "  - No se encontraron elementos coincidentes"}\n\n` +
            `Extraído en **${result.latencyMs}ms** directamente en el cliente.`;
        } else {
          synthesisText = `### 📄 DOM & Web Page Structure Inspection\n\n` +
            `The \`dom_page_inspector\` tool queried the active document tree:\n\n` +
            `- **Document Title:** \`${result.data?.pageTitle || "NanoWebMCP"}\`\n` +
            `- **Elements Found:** **${result.data?.matchesFound || 0}** nodes\n` +
            `- **Sample Elements:**\n${itemsList || "  - No elements matching selector"}\n\n` +
            `Extracted client-side in **${result.latencyMs}ms**.`;
        }
      }

      await this._streamText(synthesisText, onToken);
      onComplete?.(synthesisText, toolHistory);
      return synthesisText;
    }

    // Natural conversation about the project
    onStatus?.(isSpanish ? "Sintetizando respuesta local..." : "Synthesizing client-side answer...");
    await new Promise(r => setTimeout(r, 200));

    let directAnswer = "";
    if (
      normalized.includes("who are you") || normalized.includes("what is this") || 
      normalized.includes("quien eres") || normalized.includes("que es esto") ||
      normalized.includes("presentate") || normalized.includes("que haces")
    ) {
      if (isSpanish) {
        directAnswer = `Soy **Nano-WebMCP** (v2.0 PRO), un agente de inteligencia artificial autónomo que funciona **100% en el navegador**, creado por **Diego Peñaranda (@Diieeggoo0)**.\n\n` +
          `### 🚀 ¿Por qué es especial?\n` +
          `1. **Ejecución Local:** Diseñado para **Chrome Built-in AI** (Gemini Nano mediante la Prompt API) y con un motor de simulación WebEngine universal.\n` +
          `2. **Protocolo WebMCP:** Adapta el **Model Context Protocol (MCP)** al navegador, permitiendo al modelo invocar herramientas JavaScript en tu dispositivo sin servidores externos ni costes de API.\n` +
          `3. **Privacidad Máxima:** Tus datos, notas en la bóveda e inspecciones nunca viajan por internet.\n` +
          `4. **Multiplataforma:** Optimizado para pantallas móviles, tablets y ordenadores de escritorio.\n\n` +
          `¡Prueba a pulsar en los botones **[▶ Run Test]** en la barra lateral o escribe cualquier consulta matemática, de hardware o de bóveda!`;
      } else {
        directAnswer = `I am **Nano-WebMCP** (v2.0 Pro), an open-source client-side autonomous AI agent created by **Diego Peñaranda (@Diieeggoo0)**.\n\n` +
          `### 🚀 What makes this unique?\n` +
          `1. **On-Device Execution:** Designed for **Chrome Built-in AI** (Gemini Nano via Prompt API) and universal WebEngine simulation.\n` +
          `2. **WebMCP Protocol:** Brings the **Model Context Protocol (MCP)** directly into the browser, enabling LLMs to call local JavaScript tools without cloud servers.\n` +
          `3. **100% Privacy:** Zero prompt data, telemetry, or hardware queries leave your machine.\n` +
          `4. **Universal Compatibility:** Works seamlessly on mobile devices, tablets, and desktop browsers.\n\n` +
          `Try clicking any of the **Quick Prompt chips** above, or test tools directly using the **[▶ Run Test]** buttons in the sidebar!`;
      }
    } else if (normalized.includes("mobile") || normalized.includes("phone") || normalized.includes("android") || normalized.includes("ios") || normalized.includes("iphone") || normalized.includes("movil")) {
      if (isSpanish) {
        directAnswer = `📱 **Estado de Optimización Móvil**\n\n` +
          `Nano-WebMCP está optimizado para dispositivos móviles con diseño adaptable, pestañas táctiles segmentadas y renderizado seguro.\n\n` +
          `Dado que los navegadores móviles aún no exponen las flags experimentales de Chrome Canary de escritorio, Nano-WebMCP activa automáticamente el **WebEngine Universal**, permitiéndote probar y evaluar las 4 herramientas WebMCP en tu smartphone con latencias inferiores a 2 milisegundos.`;
      } else {
        directAnswer = `📱 **Mobile Optimization Status**\n\n` +
          `Nano-WebMCP is fully optimized for mobile devices with responsive layouts, touch-friendly navigation tabs, and adaptive client-side execution.\n\n` +
          `Since mobile browsers currently do not expose experimental desktop Chrome Canary flags, Nano-WebMCP automatically leverages its **Universal WebEngine** so you can benchmark all 4 WebMCP tools with sub-millisecond latencies right on your phone!`;
      }
    } else if (normalized.includes("tools") || normalized.includes("mcp") || normalized.includes("capabilities") || normalized.includes("herramientas")) {
      if (isSpanish) {
        directAnswer = `🛠️ **Herramientas WebMCP Registradas**\n\n` +
          `Cuento con **4 herramientas en sandbox** listas para ejecutarse:\n` +
          `- \`system_hardware_probe\`: Consulta WebGPU, núcleos lógicos y memoria RAM.\n` +
          `- \`local_privacy_vault\`: Almacenamiento cifrado y privado en el LocalStorage de tu equipo.\n` +
          `- \`math_safe_calc\`: Motor de cálculo numérico de 64 bits seguro.\n` +
          `- \`dom_page_inspector\`: Inspección de elementos, etiquetas y estructura del documento.\n\n` +
          `Puedes probar cualquiera pulsando su botón **[▶ Run Test]** a la izquierda.`;
      } else {
        directAnswer = `🛠️ **Registered WebMCP Tools Overview**\n\n` +
          `I have **4 sandboxed client tools** ready to execute:\n` +
          `- \`system_hardware_probe\`: Extracts WebGPU, logical cores, and memory.\n` +
          `- \`local_privacy_vault\`: Encrypted zero-cloud persistence in localStorage.\n` +
          `- \`math_safe_calc\`: Secure Float-64 calculation sandbox.\n` +
          `- \`dom_page_inspector\`: Real-time DOM element and heading extraction.\n\n` +
          `You can click **[▶ Run Test]** on any tool card in the left sidebar to execute it directly!`;
      }
    } else {
      if (isSpanish) {
        directAnswer = `Hola, soy **Nano-WebMCP**, ejecutándome 100% en tu navegador con **4 herramientas WebMCP** activas:\n\n` +
          `• 🔍 **Hardware & WebGPU** (\`system_hardware_probe\`)\n` +
          `• 🔒 **Bóveda Privada** (\`local_privacy_vault\`)\n` +
          `• 🧮 **Cálculo Seguro** (\`math_safe_calc\`)\n` +
          `• 📄 **Inspector DOM** (\`dom_page_inspector\`)\n\n` +
          `Pruébame preguntando: *"Analiza mi hardware y núcleos"*, *"Calcula sqrt(144 * 25) + 350"* o pulsa en los botones **[▶ Run Test]** de la izquierda.`;
      } else {
        directAnswer = `I am **Nano-WebMCP**, running 100% locally in your browser. I have access to **4 client-side WebMCP tools**:\n\n` +
          `• 🔍 **Hardware & WebGPU** (\`system_hardware_probe\`)\n` +
          `• 🔒 **Private Vault** (\`local_privacy_vault\`)\n` +
          `• 🧮 **Safe Math Engine** (\`math_safe_calc\`)\n` +
          `• 📄 **DOM Inspector** (\`dom_page_inspector\`)\n\n` +
          `Try asking: *"Probe my hardware and WebGPU"*, *"Calculate sqrt(144 * 25) + 350"*, or click the quick chips above!`;
      }
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
