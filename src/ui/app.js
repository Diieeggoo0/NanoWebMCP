/**
 * Nano-WebMCP UI Application Controller (v2.0 PRO)
 * Author: Diego Peñaranda (@Diieeggoo0)
 * 
 * Full interactive controller supporting Chrome Built-in AI, WebMCP tool calling,
 * 1-click test runners, cross-platform mobile navigation, diagnostics and telemetry.
 */

import { WebMcpServer } from '../core/webMcp.js';
import { NanoAgent } from '../core/nanoAgent.js';
import { registerBuiltinTools } from '../tools/builtinTools.js';

// ============================================================================
// Core Initialization
// ============================================================================
const mcpServer = new WebMcpServer({
  name: "ClientSideWebMcp",
  version: "2.0.0"
});

// Register Sandboxed Builtin Tools
registerBuiltinTools(mcpServer);

// Instantiate Nano Agent
const agent = new NanoAgent(mcpServer);

// ============================================================================
// DOM References
// ============================================================================
const toolsListEl = document.getElementById("toolsList");
const toolCountEl = document.getElementById("toolCount");
const mobileToolCountEl = document.getElementById("mobileToolCount");
const chatContainerEl = document.getElementById("chatContainer");
const promptFormEl = document.getElementById("promptForm");
const promptInputEl = document.getElementById("promptInput");
const sendBtnEl = document.getElementById("sendBtn");
const agentActivityEl = document.getElementById("agentActivity");
const activityTextEl = document.getElementById("activityText");

// Header Interactive Pills & Buttons
const aiStatusPillEl = document.getElementById("aiStatusPill");
const aiStatusTextEl = document.getElementById("aiStatusText");
const privacyPillEl = document.getElementById("privacyPill");
const benchBtnEl = document.getElementById("benchBtn");
const schemaBtnEl = document.getElementById("schemaBtn");
const clearChatBtnEl = document.getElementById("clearChatBtn");

// Mobile Tab Elements
const tabAgentBtn = document.getElementById("tabAgent");
const tabToolsBtn = document.getElementById("tabTools");
const sidebarPanelEl = document.getElementById("sidebarPanel");
const agentPanelEl = document.getElementById("agentPanel");

// Telemetry Elements
const telemetryLatencyEl = document.getElementById("telemetryLatency");
const telemetryEngineEl = document.getElementById("telemetryEngine");

// Modals
const diagnosticsModalEl = document.getElementById("diagnosticsModal");
const closeDiagModalEl = document.getElementById("closeDiagModal");
const diagDetailsEl = document.getElementById("diagDetails");
const engineBtnAuto = document.getElementById("engineBtnAuto");
const engineBtnNative = document.getElementById("engineBtnNative");
const engineBtnSim = document.getElementById("engineBtnSim");

const schemaModalEl = document.getElementById("schemaModal");
const closeSchemaModalEl = document.getElementById("closeSchemaModal");
const schemaContentEl = document.getElementById("schemaContent");
const copySchemaBtnEl = document.getElementById("copySchemaBtn");

const privacyModalEl = document.getElementById("privacyModal");
const closePrivacyModalEl = document.getElementById("closePrivacyModal");
const toastContainerEl = document.getElementById("toastContainer");

// ============================================================================
// Toast Notification Helper
// ============================================================================
function showToast(message, icon = "⚡") {
  if (!toastContainerEl) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  toastContainerEl.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.95)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// Copy Helper with Feedback
async function copyToClipboard(text, successMsg = "Copied to clipboard!") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showToast(successMsg, "📋");
  } catch (err) {
    showToast("Failed to copy", "⚠️");
  }
}

// ============================================================================
// Mobile Navigation Tab Switcher
// ============================================================================
function setActiveTab(tabName) {
  if (tabName === "agent") {
    tabAgentBtn?.classList.add("active");
    tabToolsBtn?.classList.remove("active");
    agentPanelEl?.classList.add("active-tab");
    sidebarPanelEl?.classList.remove("active-tab");
  } else if (tabName === "tools") {
    tabToolsBtn?.classList.add("active");
    tabAgentBtn?.classList.remove("active");
    sidebarPanelEl?.classList.add("active-tab");
    agentPanelEl?.classList.remove("active-tab");
  }
}

tabAgentBtn?.addEventListener("click", () => setActiveTab("agent"));
tabToolsBtn?.addEventListener("click", () => setActiveTab("tools"));

// ============================================================================
// Tool Rendering & 1-Click Interactive Test Runner
// ============================================================================
const TOOL_META = {
  system_hardware_probe: {
    icon: "🖥️",
    badgeClass: "hardware",
    defaultArgs: { includeGpuDetails: true },
    quickPrompt: "Probe my system hardware, WebGPU support, CPU concurrency and memory"
  },
  local_privacy_vault: {
    icon: "🔒",
    badgeClass: "vault",
    defaultArgs: { operation: "list" },
    quickPrompt: "Save a private note 'Gemini Web AI Summit 2026' into my secure vault"
  },
  math_safe_calc: {
    icon: "🧮",
    badgeClass: "math",
    defaultArgs: { expression: "Math.sqrt(144) * 25 + 350" },
    quickPrompt: "Calculate the square root of (144 * 25) plus 350 safely"
  },
  dom_page_inspector: {
    icon: "📄",
    badgeClass: "dom",
    defaultArgs: { selector: "h1, h2, h3, button" },
    quickPrompt: "Inspect the headings and interactive structure of this web page"
  }
};

function renderTools() {
  const tools = mcpServer.listTools();
  if (toolCountEl) toolCountEl.innerText = `${tools.length} tools`;
  if (mobileToolCountEl) mobileToolCountEl.innerText = tools.length;
  if (!toolsListEl) return;

  toolsListEl.innerHTML = "";

  tools.forEach(tool => {
    const meta = TOOL_META[tool.name] || {
      icon: "⚙️",
      badgeClass: "hardware",
      defaultArgs: {},
      quickPrompt: `Run tool ${tool.name}`
    };

    const card = document.createElement("div");
    card.className = `tool-card ${meta.badgeClass}`;
    card.innerHTML = `
      <div class="tool-card-header">
        <div class="tool-identity">
          <div class="tool-icon-box">${meta.icon}</div>
          <div>
            <div class="tool-card-name">${tool.name}</div>
            <span class="tool-badge-pill">WebMCP v2.0</span>
          </div>
        </div>
      </div>
      <div class="tool-card-desc">${tool.description}</div>
      <div class="tool-action-row">
        <button class="tool-btn btn-run" data-run-tool="${tool.name}" title="Run immediate client-side test">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>Run Test</span>
        </button>
        <button class="tool-btn btn-prompt" data-ask-tool="${tool.name}" title="Ask local AI to use this tool">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Ask Agent</span>
        </button>
        <button class="tool-btn btn-schema" data-schema-tool="${tool.name}" title="View JSON-RPC schema">
          <span>{ }</span>
        </button>
      </div>
    `;

    // 1. Direct Tool Runner
    card.querySelector(`[data-run-tool="${tool.name}"]`).addEventListener("click", async () => {
      setActiveTab("agent");
      await executeDirectTool(tool.name, meta.defaultArgs);
    });

    // 2. Ask Agent with Tool Preload
    card.querySelector(`[data-ask-tool="${tool.name}"]`).addEventListener("click", () => {
      setActiveTab("agent");
      if (promptInputEl) {
        promptInputEl.value = meta.quickPrompt;
        promptInputEl.focus();
      }
      handleSubmit(meta.quickPrompt);
    });

    // 3. Schema Inspector for this tool
    card.querySelector(`[data-schema-tool="${tool.name}"]`).addEventListener("click", () => {
      openSchemaModal(tool.name);
    });

    toolsListEl.appendChild(card);
  });
}

// Direct Tool Execution Runner
async function executeDirectTool(toolName, args) {
  showToast(`Executing tool: ${toolName}...`, "⚙️");
  const startTime = performance.now();

  try {
    const result = await mcpServer.callTool(toolName, args);
    const durationMs = (performance.now() - startTime).toFixed(2);
    
    // Update latency in telemetry
    if (telemetryLatencyEl) telemetryLatencyEl.innerText = `${durationMs} ms`;

    appendToolCallBanner(toolName, args, result, durationMs);
    showToast(`${toolName} completed in ${durationMs}ms`, "✅");
  } catch (err) {
    appendToolCallBanner(toolName, args, { error: err.message }, "0.00", false);
    showToast(`Error running ${toolName}: ${err.message}`, "❌");
  }
}

// ============================================================================
// Chat Rendering & Markdown Formatting
// ============================================================================
function formatMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="code-box"><code>$2</code></pre>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function appendMessage(role, text = "") {
  const msgEl = document.createElement("div");
  msgEl.className = `message ${role}-msg`;
  
  const avatar = role === "user" ? "👤" : "⚡";
  
  msgEl.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-bubble">
      <div class="content">${formatMarkdown(text)}</div>
      ${role === "assistant" ? `
        <div class="msg-actions">
          <button class="btn-msg-copy" title="Copy response to clipboard">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
      ` : ""}
    </div>
  `;

  if (role === "assistant") {
    msgEl.querySelector(".btn-msg-copy")?.addEventListener("click", () => {
      copyToClipboard(text, "Agent response copied!");
    });
  }

  chatContainerEl.appendChild(msgEl);
  chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
  return msgEl.querySelector(".content");
}

function appendToolCallBanner(toolName, args, result = null, durationMs = "0.00", isSuccess = true) {
  const banner = document.createElement("div");
  banner.className = "tool-call-banner";

  const jsonStr = result ? JSON.stringify(result.data || result, null, 2) : "Executing...";

  banner.innerHTML = `
    <div class="tool-banner-header">
      <div class="tool-banner-meta">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>WebMCP: <strong>${toolName}</strong></span>
        <span class="tool-latency-tag">${durationMs}ms</span>
      </div>
      <div class="tool-banner-controls">
        <button class="btn-toggle-json" title="Toggle JSON output">
          <span class="toggle-text">Show JSON</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <button class="btn-msg-copy btn-copy-tool" title="Copy raw JSON">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
    </div>
    <div class="tool-banner-content" style="display: none;">
      <div style="color: #64748b; margin-bottom: 4px; font-size: 0.72rem;">// Input Arguments: ${JSON.stringify(args)}</div>
      <pre style="margin: 0; white-space: pre-wrap;">${jsonStr}</pre>
    </div>
  `;

  // Toggle Collapse
  const contentEl = banner.querySelector(".tool-banner-content");
  const toggleBtn = banner.querySelector(".btn-toggle-json");
  const toggleText = banner.querySelector(".toggle-text");

  toggleBtn?.addEventListener("click", () => {
    const isHidden = contentEl.style.display === "none";
    contentEl.style.display = isHidden ? "block" : "none";
    toggleText.innerText = isHidden ? "Hide JSON" : "Show JSON";
    toggleBtn.classList.toggle("open", isHidden);
  });

  banner.querySelector(".btn-copy-tool")?.addEventListener("click", () => {
    copyToClipboard(jsonStr, "Tool output copied!");
  });

  chatContainerEl.appendChild(banner);
  chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
}

// ============================================================================
// Automated Benchmark Runner
// ============================================================================
async function runFullBenchmark() {
  setActiveTab("agent");
  showToast("Running automated WebMCP benchmark...", "⚡");

  if (benchBtnEl) {
    benchBtnEl.disabled = true;
    benchBtnEl.classList.add("loading");
  }

  agentActivityEl.style.display = "flex";
  activityTextEl.innerText = "Benchmarking 4 WebMCP tools in client sandbox...";

  try {
    const startTime = performance.now();
    const benchmarkResults = await agent.runBenchmark();
    const totalLatency = (performance.now() - startTime).toFixed(2);
    const avgLatency = (totalLatency / benchmarkResults.length).toFixed(2);

    if (telemetryLatencyEl) telemetryLatencyEl.innerText = `${avgLatency} ms`;

    // Render Benchmark Summary Box in Chat
    const benchMsg = document.createElement("div");
    benchMsg.className = "message assistant-msg";
    
    let rowsHtml = benchmarkResults.map(r => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: ${r.success ? '#10b981' : '#f43f5e'}; font-weight: bold;">${r.success ? '✓' : '✗'}</span>
          <code style="color: #38bdf8;">${r.tool}</code>
        </div>
        <div style="font-family: var(--font-mono); font-weight: 600; color: #10b981;">
          ${r.durationMs} ms
        </div>
      </div>
    `).join("");

    benchMsg.innerHTML = `
      <div class="msg-avatar">⚡</div>
      <div class="msg-bubble" style="border-color: rgba(66, 133, 244, 0.4); background: linear-gradient(135deg, rgba(17,24,39,0.9), rgba(15,23,42,0.8));">
        <h3 style="display: flex; align-items: center; gap: 8px; color: #60a5fa; margin-bottom: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          WebMCP Suite Benchmark Results
        </h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">
          Executed ${benchmarkResults.length} tools client-side with zero network egress.
        </p>

        <div style="margin-bottom: 12px;">
          ${rowsHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
          <span style="color: #94a3b8;">Total Execution Time:</span>
          <span style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;">${totalLatency} ms (avg ${avgLatency} ms/tool)</span>
        </div>
      </div>
    `;

    chatContainerEl.appendChild(benchMsg);
    chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
    showToast(`Benchmark completed: ${avgLatency}ms avg`, "⚡");
  } catch (err) {
    showToast(`Benchmark failed: ${err.message}`, "❌");
  } finally {
    agentActivityEl.style.display = "none";
    if (benchBtnEl) {
      benchBtnEl.disabled = false;
      benchBtnEl.classList.remove("loading");
    }
  }
}

benchBtnEl?.addEventListener("click", runFullBenchmark);
document.getElementById("heroBenchChip")?.addEventListener("click", runFullBenchmark);

// ============================================================================
// Form Submission & Agent Execution
// ============================================================================
async function handleSubmit(promptText) {
  if (!promptText || promptText.trim() === "") return;

  promptInputEl.value = "";
  promptInputEl.disabled = true;
  sendBtnEl.disabled = true;

  appendMessage("user", promptText);

  agentActivityEl.style.display = "flex";
  activityTextEl.innerText = "Analyzing prompt & evaluating tools...";

  let responseContentEl = null;

  try {
    await agent.execute(promptText, {
      onStatus: (status) => {
        activityTextEl.innerText = status;
      },
      onToolCall: (name, args) => {
        appendToolCallBanner(name, args);
      },
      onToken: (chunk) => {
        if (!responseContentEl) {
          responseContentEl = appendMessage("assistant", "");
        }
        responseContentEl.innerHTML = formatMarkdown(chunk);
        chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
      },
      onComplete: (finalText) => {
        if (!responseContentEl) {
          responseContentEl = appendMessage("assistant", finalText);
        } else {
          responseContentEl.innerHTML = formatMarkdown(finalText);
        }
      }
    });
  } catch (err) {
    appendMessage("assistant", `❌ **Execution Error:** ${err.message}`);
  } finally {
    agentActivityEl.style.display = "none";
    promptInputEl.disabled = false;
    sendBtnEl.disabled = false;
    promptInputEl.focus();
  }
}

promptFormEl?.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSubmit(promptInputEl.value);
});

// Quick Prompt Chips
document.querySelectorAll(".chip[data-prompt]").forEach(chip => {
  chip.addEventListener("click", () => {
    setActiveTab("agent");
    handleSubmit(chip.getAttribute("data-prompt"));
  });
});

// Clear Chat Action
clearChatBtnEl?.addEventListener("click", () => {
  // Clear all messages except the welcome hero
  const messages = chatContainerEl.querySelectorAll(".message, .tool-call-banner");
  messages.forEach(msg => msg.remove());
  showToast("Chat history cleared", "🗑️");
});

// ============================================================================
// Modals & Capabilities Diagnostics
// ============================================================================
function openModal(modalEl) {
  modalEl?.classList.add("open");
}

function closeModal(modalEl) {
  modalEl?.classList.remove("open");
}

// Diagnostics Modal
async function updateDiagnosticsView() {
  const caps = await agent.checkCapabilities();
  if (diagDetailsEl) {
    diagDetailsEl.innerText = JSON.stringify(caps, null, 2);
  }

  // Update Status Pill
  if (caps.supported && caps.status === "readily") {
    aiStatusPillEl?.classList.add("ready");
    aiStatusPillEl?.classList.remove("simulation");
    if (aiStatusTextEl) aiStatusTextEl.innerText = "Gemini Nano Active";
    if (telemetryEngineEl) telemetryEngineEl.innerText = "Gemini Nano (Native)";
  } else if (caps.supported && caps.status === "after-download") {
    aiStatusPillEl?.classList.remove("ready", "simulation");
    if (aiStatusTextEl) aiStatusTextEl.innerText = "Nano (Downloading...)";
    if (telemetryEngineEl) telemetryEngineEl.innerText = "Downloading...";
  } else {
    aiStatusPillEl?.classList.add("simulation");
    aiStatusPillEl?.classList.remove("ready");
    if (aiStatusTextEl) aiStatusTextEl.innerText = "WebEngine Simulation";
    if (telemetryEngineEl) telemetryEngineEl.innerText = "WebEngine v2.0";
  }
}

aiStatusPillEl?.addEventListener("click", async () => {
  await updateDiagnosticsView();
  openModal(diagnosticsModalEl);
});
closeDiagModalEl?.addEventListener("click", () => closeModal(diagnosticsModalEl));

// Engine Mode Switcher in Diagnostics Modal
[engineBtnAuto, engineBtnNative, engineBtnSim].forEach(btn => {
  btn?.addEventListener("click", async () => {
    [engineBtnAuto, engineBtnNative, engineBtnSim].forEach(b => b?.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.getAttribute("data-mode");
    agent.setEngineMode(mode);
    await updateDiagnosticsView();
    showToast(`Engine mode switched to: ${mode.toUpperCase()}`, "🤖");
  });
});

// Schema Modal
function openSchemaModal(filterTool = null) {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    protocol: "WebMCP / Model Context Protocol",
    version: "2.0.0",
    client: "ClientSideWebMcp",
    tools: mcpServer.listTools()
  };

  if (schemaContentEl) {
    if (filterTool) {
      const specific = schema.tools.find(t => t.name === filterTool) || schema;
      schemaContentEl.innerText = JSON.stringify(specific, null, 2);
    } else {
      schemaContentEl.innerText = JSON.stringify(schema, null, 2);
    }
  }

  openModal(schemaModalEl);
}

schemaBtnEl?.addEventListener("click", () => openSchemaModal());
closeSchemaModalEl?.addEventListener("click", () => closeModal(schemaModalEl));
copySchemaBtnEl?.addEventListener("click", () => {
  copyToClipboard(schemaContentEl.innerText, "Tool schema JSON copied!");
});

// Privacy Modal
privacyPillEl?.addEventListener("click", () => openModal(privacyModalEl));
closePrivacyModalEl?.addEventListener("click", () => closeModal(privacyModalEl));

// Global Modal Backdrop Click & ESC Key listener
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(modal => {
      modal.classList.remove("open");
    });
  }
});

// ============================================================================
// Initialization on DOM Ready
// ============================================================================
async function init() {
  renderTools();
  await updateDiagnosticsView();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
