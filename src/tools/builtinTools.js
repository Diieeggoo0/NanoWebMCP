/**
 * Built-in WebMCP Tools for Browser Environments
 * Author: Diego Peñaranda (@Diieeggoo0)
 */

export function registerBuiltinTools(mcpServer) {
  // Tool 1: Hardware & WebGPU Telemetry
  mcpServer.registerTool({
    name: "system_hardware_probe",
    description: "Probes client hardware capabilities including WebGPU support, CPU thread concurrency, and device memory.",
    inputSchema: {
      type: "object",
      properties: {
        includeGpuDetails: { type: "boolean", description: "Whether to query WebGPU adapter details" }
      }
    },
    handler: async (args) => {
      let webGpuAvailable = false;
      let gpuInfo = "Not available";

      if ("gpu" in navigator) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            webGpuAvailable = true;
            gpuInfo = adapter.info?.architecture || "Generic WebGPU Adapter";
          }
        } catch {
          gpuInfo = "Supported but access restricted";
        }
      }

      return {
        concurrencyCores: navigator.hardwareConcurrency || 4,
        deviceMemoryGB: navigator.deviceMemory || "Not exposed (standard in non-Chrome)",
        webGpuAvailable,
        gpuInfo,
        userAgent: navigator.userAgent,
        onlineStatus: navigator.onLine ? "Online" : "Offline"
      };
    }
  });

  // Tool 2: DOM & Page Inspector
  mcpServer.registerTool({
    name: "dom_page_inspector",
    description: "Inspects the current document, headings, links, and structure for content analysis.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector to query, default is 'h1, h2, h3, p'" }
      }
    },
    handler: async (args) => {
      const selector = args.selector || "h1, h2, h3, p";
      const elements = Array.from(document.querySelectorAll(selector)).slice(0, 15);
      const extracted = elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.innerText.trim().slice(0, 100)
      }));

      return {
        pageTitle: document.title,
        url: window.location.href,
        matchesFound: extracted.length,
        items: extracted
      };
    }
  });

  // Tool 3: Local Privacy Vault (Zero-Cloud Persistence)
  mcpServer.registerTool({
    name: "local_privacy_vault",
    description: "Stores or retrieves sensitive notes and keys in the browser's local sandbox without cloud sync.",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["save", "get", "list"], description: "Storage operation to perform" },
        key: { type: "string", description: "Unique identifier for the note/data" },
        value: { type: "string", description: "Content to store (only for save operation)" }
      },
      required: ["operation"]
    },
    handler: async (args) => {
      const prefix = "nano_vault_";
      if (args.operation === "save") {
        if (!args.key || args.value === undefined) throw new Error("Key and value are required to save.");
        localStorage.setItem(prefix + args.key, args.value);
        return { status: "saved", key: args.key, timestamp: new Date().toISOString() };
      }

      if (args.operation === "get") {
        if (!args.key) throw new Error("Key is required to retrieve.");
        const val = localStorage.getItem(prefix + args.key);
        return { key: args.key, found: val !== null, value: val };
      }

      if (args.operation === "list") {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keys.push(k.replace(prefix, ""));
          }
        }
        return { storedKeys: keys, count: keys.length };
      }

      throw new Error(`Unknown operation: ${args.operation}`);
    }
  });

  // Tool 4: Safe Math Calculator
  mcpServer.registerTool({
    name: "math_safe_calc",
    description: "Executes mathematical expressions with precision for calculations.",
    inputSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Math expression like '24 * 60 * 60' or 'Math.sqrt(144)'" }
      },
      required: ["expression"]
    },
    handler: async (args = {}) => {
      let rawExpr = "";
      if (typeof args === "string") {
        rawExpr = args;
      } else if (args && typeof args === "object") {
        rawExpr = args.expression || args.expr || args.input || args.query || "";
      }

      if (!rawExpr) {
        rawExpr = "Math.sqrt(144 * 25) + 350";
      }

      // Translate common English math phrases to JavaScript Math equivalents
      let parsed = rawExpr
        .replace(/square\s+root\s+of\s*/gi, "Math.sqrt")
        .replace(/sqrt\s*\(/gi, "Math.sqrt(")
        .replace(/\bplus\b/gi, "+")
        .replace(/\bminus\b/gi, "-")
        .replace(/\btimes\b/gi, "*")
        .replace(/\bdivided\s+by\b/gi, "/")
        .trim();

      // Sanitize expression allowing digits and safe Math identifiers
      const cleanExpr = parsed.replace(/[^0-9+\-*/().Math, sqrtpeiosncx]/gi, "");

      try {
        const func = new Function(`return (${cleanExpr})`);
        const result = func();
        return { expression: rawExpr, normalized: cleanExpr, result };
      } catch (err) {
        return { expression: rawExpr, normalized: cleanExpr, result: "Invalid math expression", error: err.message };
      }
    }
  });
}
