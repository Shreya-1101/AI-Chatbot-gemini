const input    = document.getElementById("userInput");
const messages = document.getElementById("chatMessages");

marked.setOptions({ breaks: true, gfm: true });

input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

function suggest(btn) {
  input.value = btn.textContent;
  sendMessage();
}

async function uploadResume() {
  const fileInput = document.getElementById("resumeFile");
  const status    = document.getElementById("uploadStatus");
  const file      = fileInput.files[0];

  if (!file) return;

  status.textContent = "⏳ Uploading...";
  status.className   = "upload-status loading";

  const formData = new FormData();
  formData.append("resume", file);

  try {
    const res  = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (data.message) {
      status.textContent = "✅ " + data.message;
      status.className   = "upload-status success";
      appendMessage("bot", "📄 Resume uploaded successfully! I've read your resume. You can now ask me to **review it**, suggest **improvements**, or ask anything about it!");
    } else {
      status.textContent = "❌ " + data.error;
      status.className   = "upload-status error";
    }
  } catch (err) {
    status.textContent = "❌ Upload failed";
    status.className   = "upload-status error";
  }
}

function appendMessage(role, text) {
  const welcome = messages.querySelector(".welcome");
  if (welcome) welcome.remove();

  const msg    = document.createElement("div");
  msg.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "🧑" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (role === "bot") {
    bubble.innerHTML = marked.parse(text);
  } else {
    bubble.textContent = text;
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const msg = document.createElement("div");
  msg.className = "message bot typing";
  msg.id = "typing";
  msg.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";
  showTyping();

  try {
    const res  = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    removeTyping();
    appendMessage("bot", data.response || data.error);
  } catch (err) {
    removeTyping();
    appendMessage("bot", "Sorry, something went wrong. Please try again.");
  }
}