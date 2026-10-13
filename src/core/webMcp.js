/**
 * WebMCP - Model Context Protocol Client & Server for Web Browsers
 * Author: Diego Peñaranda (@Diieeggoo0)
 * License: MIT
 *
 * Implements a standards-compliant client-side Model Context Protocol (MCP) engine
 * designed for Chrome Built-in AI, Gemini Nano, and Web Agents.
 */

export class WebMcpServer {
  constructor(options = {}) {
    this.name = options.name || "WebMcpServer";
    this.version = options.version || "1.0.0";
    this.tools = new Map();
    this.resources = new Map();
  }

  /**
   * Registers a tool conforming to the Model Context Protocol schema
   * @param {Object} toolDef
   * @param {string} toolDef.name - Unique identifier of the tool
   * @param {string} toolDef.description - Clear description for the LLM
   * @param {Object} toolDef.inputSchema - JSON Schema of the parameters
   * @param {Function} toolDef.handler - Async function returning tool execution result
   */
  registerTool({ name, description, inputSchema, handler }) {
    if (!name || typeof handler !== "function") {
      throw new Error(`[WebMCP] Invalid tool definition for "${name}". Must include name and handler.`);
    }

    this.tools.set(name, {
      name,
      description: description || "No description provided",
      inputSchema: inputSchema || { type: "object", properties: {} },
      handler
    });

    console.log(`[WebMCP] Registered tool: ${name}`);
  }

  /**
   * Lists all registered tools formatted for MCP specification
   * @returns {Array<Object>}
   */
  listTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Executes a registered tool by name with arguments
   * @param {string} name 
   * @param {Object} args 
   * @returns {Promise<Object>}
   */
  async callTool(name, args = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`[WebMCP] Tool "${name}" is not registered.`);
    }

    const startTime = performance.now();
    try {
      const result = await tool.handler(args);
      const executionMs = (performance.now() - startTime).toFixed(2);
      
      return {
        success: true,
        tool: name,
        executionTimeMs: Number(executionMs),
        data: result
      };
    } catch (err) {
      const executionMs = (performance.now() - startTime).toFixed(2);
      return {
        success: false,
        tool: name,
        executionTimeMs: Number(executionMs),
        error: err.message || String(err)
      };
    }
  }

  /**
   * Formats the tools into a system prompt injection for models without native tool-calling
   * @returns {string}
   */
  getToolsSystemPrompt() {
    const toolList = this.listTools();
    if (toolList.length === 0) return "";

    return `
You have access to client-side WebMCP tools that run locally in the user's browser.
To call a tool, you MUST respond in the following JSON format:
\`\`\`json
{
  "action": "call_tool",
  "tool": "TOOL_NAME",
  "arguments": { ... }
}
\`\`\`

Available Tools:
${JSON.stringify(toolList, null, 2)}

When you receive the tool execution result, formulate your final clear answer to the user.
If no tool is required, respond directly with your answer.
`.trim();
  }
}
