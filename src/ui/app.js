/**
 * Nano-WebMCP UI Application Controller
 * Author: Diego Peñaranda (@Diieeggoo0)
 */

import { WebMcpServer } from '../core/webMcp.js';
import { NanoAgent } from '../core/nanoAgent.js';
import { registerBuiltinTools } from '../tools/builtinTools.js';

// Initialize WebMCP Server
const mcpServer = new WebMcpServer({
  name: "ClientSideWebMcp",
  version: "1.0.0"
});

// Register Default Tools
registerBuiltinTools(mcpServer);

// Instantiate Agent
const agent = new NanoAgent(mcpServer);

// DOM Elements
const toolsListEl = document.getElementById("toolsList");
const toolCountEl = document.getElementById("toolCount");
const chatContainerEl = document.getElementById("chatContainer");
const promptFormEl = document.getElementById("promptForm");
const promptInputEl = document.getElementById("promptInput");
const sendBtnEl = document.getElementById("sendBtn");
const agentActivityEl = document.getElementById("agentActivity");
const activityTextEl = document.getElementById("activityText");
const aiStatusPillEl = document.getElementById("aiStatusPill");
const aiStatusTextEl = document.getElementById("aiStatusText");

// Render Registered Tools in Sidebar
function renderTools() {
  const tools = mcpServer.listTools();
  toolCountEl.innerText = `${tools.length} tools`;
  toolsListEl.innerHTML = "";

  tools.forEach(tool => {
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML = `
      <div class="tool-card-title">${tool.name}</div>
      <div class="tool-card-desc">${tool.description}</div>
    `;
    toolsListEl.appendChild(card);
  });
}

// Append Message to Chat
function appendMessage(role, text = "") {
  const msgEl = document.createElement("div");
  msgEl.className = `message ${role}-msg`;
  msgEl.innerHTML = `
    <div class="avatar">${role === "user" ? "👤" : "⚡"}</div>
    <div class="content">${formatMarkdown(text)}</div>
  `;
  chatContainerEl.appendChild(msgEl);
  chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
  return msgEl.querySelector(".content");
}

function appendToolCallBanner(toolName, args) {
  const banner = document.createElement("div");
  banner.className = "tool-call-banner";
  banner.innerHTML = `
    <span>⚡ WebMCP Tool Invocation</span>
    <span class="tool-badge-pill">${toolName}</span>
  `;
  chatContainerEl.appendChild(banner);
  chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
}

// Basic markdown format helper
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// Handle Form Submission
async function handleSubmit(promptText) {
  if (!promptText || promptText.trim() === "") return;

  promptInputEl.value = "";
  promptInputEl.disabled = true;
  sendBtnEl.disabled = true;

  appendMessage("user", promptText);

  agentActivityEl.style.display = "flex";
  activityTextEl.innerText = "Analyzing prompt...";

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
    appendMessage("assistant", `❌ **Error:** ${err.message}`);
  } finally {
    agentActivityEl.style.display = "none";
    promptInputEl.disabled = false;
    sendBtnEl.disabled = false;
    promptInputEl.focus();
  }
}

// Event Listeners
promptFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSubmit(promptInputEl.value);
});

// Quick Chips
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    handleSubmit(chip.getAttribute("data-prompt"));
  });
});

// App Initialization
async function init() {
  renderTools();

  // Check Chrome Built-in AI
  const status = await agent.checkCapabilities();
  if (status.supported && status.status === "readily") {
    aiStatusPillEl.classList.add("ready");
    aiStatusTextEl.innerText = "Gemini Nano Active (On-Device)";
  } else if (status.supported && status.status === "after-download") {
    aiStatusTextEl.innerText = "Gemini Nano (Downloading...)";
  } else {
    aiStatusTextEl.innerText = "Web Simulation Mode (Active)";
  }
}

init();
