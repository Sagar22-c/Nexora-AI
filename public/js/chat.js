let messages = [];
let chats = [];
let currentChatId = null;

// =========================================================
// ELEMENTS
// =========================================================

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatHistoryList = document.getElementById("chatHistoryList");
const newChatBtn = document.getElementById("newChatBtn");

// =========================================================
// CHECK ELEMENTS
// =========================================================

console.log("messageInput:", messageInput);
console.log("sendBtn:", sendBtn);
console.log("chatBox:", chatBox);

// =========================================================
// INITIAL LOAD
// =========================================================

loadChats();

// =========================================================
// SEND EVENTS
// =========================================================

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    console.log("ENTER DETECTED");

    sendMessage();
  }
});

// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message || sendBtn.disabled) {
    return;
  }

  // =========================================
  // ADD USER MESSAGE LOCALLY
  // =========================================

  messages.push({
    role: "user",
    content: message,
  });

  addMessage("user", message);

  messageInput.value = "";

  // =========================================
  // LOADING
  // =========================================

  showLoading();

  sendBtn.disabled = true;

  try {
    // =========================================
    // SEND TO BACKEND
    // =========================================

    const response = await fetch("/chat/api", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        messages: messages,
        chatId: currentChatId,
      }),
    });

    console.log("CHAT RESPONSE:", response.status);

    // =========================================
    // SERVER ERROR
    // =========================================

    if (!response.ok) {
      const errorText = await response.text();

      console.error("SERVER ERROR:", errorText);

      throw new Error("AI request failed");
    }

    // =========================================
    // CHECK STREAM
    // =========================================

    if (!response.body) {
      throw new Error("No streaming response");
    }

    // =========================================
    // REMOVE LOADING
    // =========================================

    removeLoading();

    // =========================================
    // CREATE EMPTY AI MESSAGE
    // =========================================

    const aiMessageElement = addMessage("ai", "");

    const aiTextElement = aiMessageElement.querySelector(".message-text");

    let answer = "";

    // =========================================
    // STREAM READER
    // =========================================

    const reader = response.body.getReader();

    const decoder = new TextDecoder();

    let buffer = "";

    // =========================================
    // READ STREAM
    // =========================================

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      // Split SSE lines
      const lines = buffer.split("\n");

      // Keep incomplete line
      buffer = lines.pop() || "";

      // =========================================
      // PROCESS LINES
      // =========================================

      for (let line of lines) {
        line = line.trim();

        if (!line.startsWith("data:")) {
          continue;
        }

        // Remove "data:"
        const jsonString = line.replace(/^data:\s*/, "").trim();

        if (!jsonString || jsonString === "[DONE]") {
          continue;
        }

        try {
          const data = JSON.parse(jsonString);

          console.log("STREAM DATA:", data);

          // =====================================
          // AI TEXT CHUNK
          // =====================================

          if (data.type === "chunk") {
            answer += data.content;

            aiTextElement.innerHTML = formatMessage(answer);

            addCopyButtons(aiMessageElement);

            scrollToBottom();
          }

          // =====================================
          // CHAT SAVED
          // =====================================

          if (data.type === "done") {
            console.log("CHAT SAVED:", data.chatId);

            currentChatId = data.chatId;
          }

          // =====================================
          // BACKEND ERROR
          // =====================================

          if (data.type === "error") {
            throw new Error(data.message);
          }
        } catch (error) {
          console.error("SSE PARSE ERROR:", jsonString, error);
        }
      }
    }

    // =========================================
    // SAVE AI MESSAGE LOCALLY
    // =========================================

    if (answer) {
      messages.push({
        role: "assistant",
        content: answer,
      });
    }

    // =========================================
    // REFRESH RECENT CHATS
    // =========================================

    await loadChats();

    renderChatHistory();
  } catch (error) {
    console.error("CHAT ERROR:", error);

    removeLoading();

    addMessage("ai", "Sorry, something went wrong. Please try again.");
  }

  // =========================================
  // ENABLE SEND
  // =========================================

  sendBtn.disabled = false;

  messageInput.focus();
}

// =========================================================
// LOAD ALL CHATS
// =========================================================

async function loadChats() {
  try {
    const response = await fetch("/chat/history");

    console.log("HISTORY RESPONSE:", response.status);

    if (!response.ok) {
      throw new Error("Failed to load chat history");
    }

    const data = await response.json();

    console.log("CHAT HISTORY:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to load chats");
    }

    chats = data.chats || [];

    renderChatHistory();
  } catch (error) {
    console.error("LOAD CHATS ERROR:", error);
  }
}

// =========================================================
// LOAD SINGLE CHAT
// =========================================================

async function loadChat(chatId) {
  try {
    const response = await fetch(`/chat/history/${chatId}`);

    if (!response.ok) {
      throw new Error("Failed to load chat");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load chat");
    }

    const chat = data.chat;

    // =========================================
    // SET CURRENT CHAT
    // =========================================

    currentChatId = chat._id;

    // =========================================
    // LOAD MESSAGES
    // =========================================

    messages = [...chat.messages];

    // =========================================
    // CLEAR CHAT BOX
    // =========================================

    chatBox.innerHTML = "";

    // =========================================
    // DISPLAY MESSAGES
    // =========================================

    messages.forEach((message) => {
      if (message.role === "user") {
        addMessage("user", message.content);
      }

      if (message.role === "assistant") {
        addMessage("ai", message.content);
      }
    });

    // =========================================
    // UPDATE SIDEBAR
    // =========================================

    renderChatHistory();

    messageInput.focus();

    console.log("Loaded chat:", chat._id);
  } catch (error) {
    console.error("LOAD CHAT ERROR:", error);
  }
}

// =========================================================
// RENDER CHAT HISTORY
// =========================================================

function renderChatHistory() {
  chatHistoryList.innerHTML = "";

  chats.forEach((chat) => {
    const chatItem = document.createElement("button");

    chatItem.className = "chat-history-item";

    chatItem.textContent = chat.title;

    chatItem.dataset.id = chat._id;

    // Active chat
    if (String(chat._id) === String(currentChatId)) {
      chatItem.classList.add("active");
    }

    chatItem.addEventListener("click", () => {
      loadChat(chat._id);
    });

    chatHistoryList.appendChild(chatItem);
  });
}

// =========================================================
// NEW CHAT
// =========================================================

newChatBtn.addEventListener("click", startNewChat);

function startNewChat() {
  messages = [];

  currentChatId = null;

  chatBox.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">
        ✦
      </div>

      <h2>
        Welcome to Nexora AI
      </h2>

      <p>
        Ask me anything. I'm here to help
        you learn, code, brainstorm, and
        explore ideas.
      </p>
    </div>
  `;

  renderChatHistory();

  messageInput.focus();
}

// =========================================================
// CLEAR CURRENT CHAT
// =========================================================

clearChatBtn.addEventListener("click", clearCurrentChat);

async function clearCurrentChat() {
  if (!currentChatId) {
    startNewChat();
    return;
  }

  const chatId = currentChatId;

  try {
    const response = await fetch(`/chat/history/${chatId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete chat");
    }

    // =========================================
    // REMOVE FROM FRONTEND
    // =========================================

    chats = chats.filter((chat) => String(chat._id) !== String(chatId));

    // =========================================
    // RESET
    // =========================================

    messages = [];

    currentChatId = null;

    chatBox.innerHTML = `
      <div class="welcome">
        <div class="welcome-icon">
          ✦
        </div>

        <h2>
          Welcome to Nexora AI
        </h2>

        <p>
          Ask me anything. I'm here to help
          you learn, code, brainstorm, and
          explore ideas.
        </p>
      </div>
    `;

    renderChatHistory();

    messageInput.focus();
  } catch (error) {
    console.error("DELETE CHAT ERROR:", error);
  }
}

// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(type, text) {
  const messageElement = document.createElement("div");

  messageElement.classList.add("message");

  if (type === "user") {
    messageElement.classList.add("user-message");
  } else {
    messageElement.classList.add("ai-message");
  }

  const avatar = type === "user" ? "U" : "✦";

  const name = type === "user" ? "You" : "Nexora";

  const content =
    type === "ai"
      ? formatMessage(text)
      : escapeHTML(text).replace(/\n/g, "<br>");

  messageElement.innerHTML = `
    <div class="message-avatar">
      ${avatar}
    </div>

    <div class="message-content">

      <span class="message-name">
        ${name}
      </span>

      <div class="message-text">
        ${content}
      </div>

    </div>
  `;

  chatBox.appendChild(messageElement);

  addCopyButtons(messageElement);

  scrollToBottom();

  return messageElement;
}

// =========================================================
// FORMAT AI MESSAGE
// =========================================================

function formatMessage(text) {
  if (!text) {
    return "";
  }

  text = text.replace(/^\s*(\*\*✦\*\*|\*\*Nexora\*\*|Nexora:|AI:)\s*/i, "");

  return marked.parse(text);
}

// =========================================================
// ESCAPE USER MESSAGE
// =========================================================

function escapeHTML(text) {
  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

// =========================================================
// COPY CODE BUTTONS
// =========================================================

function addCopyButtons(messageElement) {
  const codeBlocks = messageElement.querySelectorAll("pre");

  codeBlocks.forEach((pre) => {
    const code = pre.querySelector("code");

    if (!code || pre.querySelector(".code-header")) {
      return;
    }

    let language = "code";

    const className = code.className || "";

    const match = className.match(/language-(\w+)/);

    if (match) {
      language = match[1];
    }

    const header = document.createElement("div");

    header.className = "code-header";

    header.innerHTML = `
      <span class="code-language">
        ${language}
      </span>

      <button
        class="copy-code-btn"
        type="button"
      >
        📋 Copy
      </button>
    `;

    pre.insertBefore(header, code);

    const copyButton = header.querySelector(".copy-code-btn");

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);

        copyButton.textContent = "✓ Copied";

        copyButton.classList.add("copied");

        setTimeout(() => {
          copyButton.textContent = "📋 Copy";

          copyButton.classList.remove("copied");
        }, 2000);
      } catch (error) {
        console.error("Copy failed:", error);
      }
    });
  });
}

// =========================================================
// LOADING
// =========================================================

function showLoading() {
  removeLoading();

  const loading = document.createElement("div");

  loading.id = "loadingMessage";

  loading.classList.add("message", "ai-message");

  loading.innerHTML = `
    <div class="message-avatar">
      ✦
    </div>

    <div class="message-content">

      <span class="message-name">
        Nexora
      </span>

      <div class="thinking">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
  `;

  chatBox.appendChild(loading);

  scrollToBottom();
}

// =========================================================
// REMOVE LOADING
// =========================================================

function removeLoading() {
  const loading = document.getElementById("loadingMessage");

  if (loading) {
    loading.remove();
  }
}

// =========================================================
// AUTO SCROLL
// =========================================================

function scrollToBottom() {
  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: "smooth",
  });
}
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
});
