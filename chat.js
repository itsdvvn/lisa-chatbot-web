// LISA Chat — full chat logic with Markdown, voice, export, multi-file, pull-to-refresh

document.addEventListener("DOMContentLoaded", function () {
  const chatbox = document.getElementById("chatbox");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const fileInput = document.getElementById("fileInput");
  const filePreview = document.getElementById("filePreview");
  const fileName = document.getElementById("fileName");
  const removeFileBtn = document.getElementById("removeFileBtn");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  const welcomeCard = document.getElementById("welcomeCard");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const exportChatBtn = document.getElementById("exportChatBtn");
  const voiceBtn = document.getElementById("voiceBtn");

  let lastMessageDate = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;

  // --- DARK MODE INIT & TOGGLE ---
  initDarkMode();
  const chatDarkToggle = document.getElementById("chatDarkToggle");
  function updateChatDarkIcon() {
    if (!chatDarkToggle) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const icon = chatDarkToggle.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = isDark ? "light_mode" : "dark_mode";
    }
  }
  if (chatDarkToggle) {
    chatDarkToggle.addEventListener("click", function () {
      toggleDarkMode();
      updateChatDarkIcon();
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      trackGAEvent("theme_toggle", { theme: currentTheme, page: "chat" });
    });
    updateChatDarkIcon();
  }

  function hideWelcome() {
    if (welcomeCard) welcomeCard.style.display = "none";
  }

  function updateSendBtn() {
    const hasText = input.value.trim().length > 0;
    const hasFile = fileInput.files.length > 0;
    sendBtn.disabled = !hasText && !hasFile;
  }
  updateSendBtn();

  const webhookUrl =
    "https://n8n.terato.my.id/webhook/50e27e1d-f8f3-43e8-a1a8-53fa5eafecdf";
  const HISTORY_KEY = "lisaChatHistory";
  const EXPIRATION_DAYS = 7;

  // Track Chat Session Start
  trackGAEvent("chat_session_start", { page: "chat" });

  // --- RATE LIMIT & QUOTA CONSTANTS ---
  const MAX_PHOTO_UPLOADS = 3;
  const MAX_MESSAGES_PER_SESSION = 50;
  const MAX_MESSAGES_PER_MINUTE = 12;
  const MIN_SEND_INTERVAL_MS = 1500; // 1.5 detik cooldown

  let lastSendTimestamp = 0;
  let recentMessageTimestamps = [];

  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const sessionId =
    localStorage.getItem("lisaSession") || generateUUID();
  localStorage.setItem("lisaSession", sessionId);

  // --- PHOTO & MESSAGE RATE LIMIT PER SESSION ---
  const PHOTO_COUNT_KEY = "lisaPhotoCount_" + sessionId;
  const MSG_COUNT_KEY = "lisaMsgCount_" + sessionId;

  function getPhotoUploadCount() {
    return parseInt(localStorage.getItem(PHOTO_COUNT_KEY) || "0", 10);
  }

  function incrementPhotoUploadCount(amount = 1) {
    const current = getPhotoUploadCount();
    const updated = current + amount;
    localStorage.setItem(PHOTO_COUNT_KEY, updated.toString());
    updateUploadButtonState();
    return updated;
  }

  function getSessionMessageCount() {
    return parseInt(localStorage.getItem(MSG_COUNT_KEY) || "0", 10);
  }

  function incrementSessionMessageCount() {
    const current = getSessionMessageCount();
    const updated = current + 1;
    localStorage.setItem(MSG_COUNT_KEY, updated.toString());
    return updated;
  }

  function resetSessionLimits() {
    localStorage.removeItem(PHOTO_COUNT_KEY);
    localStorage.removeItem(MSG_COUNT_KEY);
    updateUploadButtonState();
  }

  function getRemainingPhotoUploads() {
    return Math.max(0, MAX_PHOTO_UPLOADS - getPhotoUploadCount());
  }

  function checkRateLimit() {
    const now = Date.now();

    // 1. Minimum send interval cooldown
    if (now - lastSendTimestamp < MIN_SEND_INTERVAL_MS) {
      return {
        allowed: false,
        reason: "cooldown",
        waitSec: Math.ceil((MIN_SEND_INTERVAL_MS - (now - lastSendTimestamp)) / 1000),
      };
    }

    // 2. Velocity limit (messages in last 60 seconds)
    recentMessageTimestamps = recentMessageTimestamps.filter(
      (t) => now - t < 60000,
    );
    if (recentMessageTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
      const oldestInWindow = recentMessageTimestamps[0];
      const waitSec = Math.max(1, Math.ceil((60000 - (now - oldestInWindow)) / 1000));
      return { allowed: false, reason: "velocity", waitSec };
    }

    // 3. Max messages per session
    if (getSessionMessageCount() >= MAX_MESSAGES_PER_SESSION) {
      return { allowed: false, reason: "session_limit" };
    }

    return { allowed: true };
  }

  const fileInputLabel = document.querySelector('label[for="fileInput"]');

  function updateUploadButtonState() {
    const remaining = getRemainingPhotoUploads();
    if (fileInputLabel) {
      if (remaining <= 0) {
        fileInputLabel.classList.add("opacity-40", "cursor-not-allowed");
        fileInputLabel.setAttribute(
          "title",
          `Batas upload foto (${MAX_PHOTO_UPLOADS}/${MAX_PHOTO_UPLOADS}) tercapai. Hapus chat untuk sesi baru.`,
        );
      } else {
        fileInputLabel.classList.remove("opacity-40", "cursor-not-allowed");
        fileInputLabel.setAttribute(
          "title",
          `Upload foto (${remaining} kuota tersisa dari maks. ${MAX_PHOTO_UPLOADS})`,
        );
      }
    }
  }
  updateUploadButtonState();

  // --- SUGGESTION CHIPS ---
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const promptText = chip.getAttribute("data-suggestion");
      trackGAEvent("quick_suggestion_click", { suggestion_text: promptText, source: "welcome_card" });
      input.value = promptText;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
      updateSendBtn();
      sendMessage();
    });
  });

  let isSending = false;

  // --- QUICK REPLY BUTTONS & ACTION CHIPS (dynamic) ---
  document.addEventListener("click", function (e) {
    const qr = e.target.closest(".quick-reply-btn");
    if (qr) {
      if (isSending) return;
      const val = qr.getAttribute("data-value") || qr.textContent.trim();
      trackGAEvent("quick_reply_click", { reply_value: val });
      input.value = val;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
      updateSendBtn();
      sendMessage();
      return;
    }

    const chip = e.target.closest(".quick-chip");
    if (chip) {
      if (isSending) return;
      const sendVal = chip.getAttribute("data-send");
      trackGAEvent("quick_chip_click", { chip_value: sendVal, source: "bottom_bar" });
      input.value = sendVal;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
      updateSendBtn();
      sendMessage();
    }
  });

  // --- CLEAR CHAT ---
  clearChatBtn.addEventListener("click", () => {
    if (chatbox.children.length <= 1) return;
    if (
      !confirm(
        "Hapus seluruh riwayat percakapan?\n\nTindakan ini tidak bisa dibatalkan.",
      )
    )
      return;
    trackGAEvent("clear_chat_history", { total_messages: getSessionMessageCount() });
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("lisaSession");
    resetSessionLimits();
    location.reload();
  });

  // --- FILE INPUT & LIMIT VALIDATION ---
  fileInput.addEventListener("click", (e) => {
    const remaining = getRemainingPhotoUploads();
    if (remaining <= 0) {
      e.preventDefault();
      alert(
        `⚠️ Batas kuota upload foto per sesi telah tercapai (maksimal ${MAX_PHOTO_UPLOADS} foto per sesi).\n\nKamu tetap bisa berkonsultasi via teks, atau bersihkan riwayat chat (ikon tempat sampah) untuk memulai sesi baru dengan kuota penuh.`,
      );
    }
  });

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    const remaining = getRemainingPhotoUploads();

    if (files.length > remaining) {
      alert(
        `⚠️ Kamu memilih ${files.length} foto, tetapi sisa kuota sesi ini hanya ${remaining} foto (maks. ${MAX_PHOTO_UPLOADS} foto per sesi).\n\nSilakan pilih foto lebih sedikit atau hapus riwayat chat untuk memulai sesi baru.`,
      );
      fileInput.value = null;
      updateFilePreview();
      updateSendBtn();
      return;
    }

    // Validate size (max 5MB per file)
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        alert(
          `⚠️ File "${f.name}" melebihi batas ukuran 5MB. Silakan pilih foto dengan ukuran lebih kecil.`,
        );
        fileInput.value = null;
        updateFilePreview();
        updateSendBtn();
        return;
      }
    }

    if (files.length > 0) {
      trackGAEvent("image_attached", { count: files.length, file_names: files.map(f => f.name).join(",") });
    }

    updateFilePreview();
    updateSendBtn();
  });

  removeFileBtn.addEventListener("click", () => {
    fileInput.value = null;
    filePreview.style.display = "none";
    fileName.textContent = "";
    updateSendBtn();
  });

  function updateFilePreview() {
    const files = fileInput.files;
    if (files.length > 0) {
      const names = Array.from(files)
        .map((f) => f.name)
        .join(", ");
      const remaining = getRemainingPhotoUploads();
      fileName.textContent = `${names} (${files.length} foto — sisa kuota sesi: ${remaining - files.length})`;
      filePreview.style.display = "flex";
    } else {
      filePreview.style.display = "none";
      fileName.textContent = "";
    }
  }

  // --- READ FILE ---
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // --- ADD MESSAGE ---
  function addMessage(message, sender, save = true) {
    const text = message.text.trim();
    if (sender === "bot" && text.includes("[BUKA_FORM_LAPORAN]")) {
      openForm();
      return;
    }
    // Check for quick reply format: [BUTTONS:label1|value1,label2|value2] or [QR:...]
    const qrMatch = text.match(/\[(BUTTONS|QR):(.+?)\]$/i);
    let qrData = null;
    let cleanText = text;
    if (qrMatch) {
      qrData = qrMatch[2].split(",").map((pair) => {
        const [label, value] = pair.split("|");
        return { label: label.trim(), value: (value || label).trim() };
      });
      cleanText = text.replace(/\[(BUTTONS|QR):.+?\]$/i, "").trim();
    }

    if (message.date !== lastMessageDate) {
      const dateSep = document.createElement("div");
      dateSep.classList.add("date-separator");
      dateSep.innerHTML = `<span class="date-separator-badge">${getFormattedDate(message.date)}</span>`;
      chatbox.appendChild(dateSep);
      lastMessageDate = message.date;
    }

    const row = document.createElement("div");
    row.classList.add("msg-row", sender);

    const wrap = document.createElement("div");
    wrap.classList.add("msg-wrap");

    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);

    const content = document.createElement("div");
    content.classList.add("bubble-content");

    if (typeof text === "string" && text.startsWith("data:image/")) {
      content.innerHTML =
        '<img src="' +
        text +
        '" alt="Lampiran gambar" class="rounded-xl max-w-[240px] block my-1">';
    } else if (typeof text === "string" && text.startsWith("data:application/")) {
      content.innerHTML =
        '<div class="flex items-center gap-2 text-primary font-medium"><span class="material-symbols-outlined">description</span> Dokumen terlampir</div>';
    } else {
      if (sender === "bot") {
        content.innerHTML = parseMarkdown(cleanText || text);
      } else {
        content.innerHTML = linkify(cleanText || text);
      }
    }
    bubble.appendChild(content);

    // Quick reply buttons
    if (qrData && qrData.length > 0) {
      const qrContainer = document.createElement("div");
      qrContainer.classList.add("quick-reply-container");
      qrData.forEach((qr) => {
        const btn = document.createElement("button");
        btn.classList.add("quick-reply-btn");
        btn.setAttribute("data-value", qr.value);
        btn.textContent = qr.label;
        qrContainer.appendChild(btn);
      });
      bubble.appendChild(qrContainer);
    }

    wrap.appendChild(bubble);

    const timeEl = document.createElement("span");
    timeEl.classList.add("msg-time");
    timeEl.textContent = message.time;
    wrap.appendChild(timeEl);

    if (sender === "bot") {
      const avatar = document.createElement("img");
      avatar.src = "/images/lisa-avatar.webp";
      avatar.alt = "LISA";
      avatar.width = 32;
      avatar.height = 32;
      avatar.classList.add("msg-avatar");
      avatar.loading = "lazy";
      row.appendChild(avatar);
    }

    row.appendChild(wrap);

    const isScrolledToBottom =
      chatbox.scrollHeight - chatbox.clientHeight <=
      chatbox.scrollTop + 100;
    chatbox.appendChild(row);

    if (isScrolledToBottom) {
      chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
    }

    if (text.startsWith("Saran & Masukan (ID:")) save = false;
    if (save) saveChatHistory(message, sender);
  }

  // --- TYPING INDICATOR ---
  function addTyping() {
    const row = document.createElement("div");
    row.classList.add("msg-row", "bot");
    row.id = "typing";

    const avatar = document.createElement("img");
    avatar.src = "/images/lisa-avatar.webp";
    avatar.alt = "LISA";
    avatar.width = 32;
    avatar.height = 32;
    avatar.classList.add("msg-avatar");
    row.appendChild(avatar);

    const wrap = document.createElement("div");
    wrap.classList.add("msg-wrap");

    const bubble = document.createElement("div");
    bubble.classList.add("bubble", "bot");
    bubble.innerHTML =
      '<div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';

    wrap.appendChild(bubble);
    row.appendChild(wrap);
    chatbox.appendChild(row);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
  }

  // --- SEND MESSAGE ---
  async function sendMessage() {
    if (isSending) return;
    const text = input.value.trim();
    const files = fileInput.files;
    if (!text && files.length === 0) return;

    // Rate Limit Check
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      if (rateCheck.reason === "cooldown") {
        return;
      } else if (rateCheck.reason === "velocity") {
        alert(
          `⏳ Kamu mengetik terlalu cepat. Silakan tunggu ${rateCheck.waitSec} detik sebelum mengirim pesan berikutnya ya 😊`,
        );
        return;
      } else if (rateCheck.reason === "session_limit") {
        alert(
          `⚠️ Batas kuota percakapan untuk sesi ini (${MAX_MESSAGES_PER_SESSION} pesan) telah tercapai.\n\nSilakan klik ikon tempat sampah di pojok kanan atas untuk menghapus riwayat chat dan memulai sesi percakapan baru.`,
        );
        return;
      }
    }

    lastSendTimestamp = Date.now();
    recentMessageTimestamps.push(lastSendTimestamp);
    incrementSessionMessageCount();

    // Track GA4 Send Message Event
    const hasImageAttachment = files && files.length > 0;
    trackGAEvent("send_message", {
      msg_type: hasImageAttachment ? (text ? "image_with_caption" : "image_only") : "text_only",
      has_image: hasImageAttachment,
      image_count: hasImageAttachment ? files.length : 0,
      message_length: text.length
    });

    isSending = true;
    hideWelcome();
    const now = new Date();
    const time = now
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(".", ":");
    const date = now.toLocaleDateString("id-ID");
    input.value = "";
    input.style.height = "auto";
    filePreview.style.display = "none";
    fileName.textContent = "";
    updateSendBtn();

    if (text) addMessage({ text, time, date }, "user");

    // Retrieve recent conversation history from localStorage to guarantee 100% multi-turn context
    let recentHistory = [];
    try {
      const st = localStorage.getItem(HISTORY_KEY);
      if (st) {
        const d = JSON.parse(st);
        if (d && Array.isArray(d.chats)) {
          // Take last 6 messages
          recentHistory = d.chats.slice(-6).map((c) => {
            const senderLabel = c.sender === "user" ? "User" : "LISA";
            const msgTxt = (c.message && c.message.text ? c.message.text : "").replace(/\[(BUTTONS|QR):.+?\]$/i, "").trim();
            return `${senderLabel}: ${msgTxt}`;
          });
        }
      }
    } catch (e) {}

    const conversationContext = recentHistory.join("\n");

    const formData = new FormData();
    formData.append("text", text);
    formData.append("chatInput", text);
    formData.append("sessionId", sessionId);
    formData.append("conversationHistory", conversationContext);

    // Multi-file upload
    if (files.length > 0) {
      const fileCount = files.length;
      for (let i = 0; i < fileCount; i++) {
        const file = files[i];
        try {
          const b = await readFileAsDataURL(file);
          addMessage({ text: b, time, date }, "user");
        } catch (e) {
          addMessage(
            { text: "[Gagal memuat preview " + file.name + "]", time, date },
            "user",
          );
        }
        formData.append("file", file);
        formData.append("file0", file);
      }
      incrementPhotoUploadCount(fileCount);
      fileInput.value = null;
    }

    const requestStartTime = Date.now();
    addTyping();
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      removeTyping();

      const responseDuration = Date.now() - requestStartTime;
      trackGAEvent("bot_response_received", {
        response_time_ms: responseDuration,
        status: "success"
      });

      const botNow = new Date();
      const botTime = botNow
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        .replace(".", ":");
      const botDate = botNow.toLocaleDateString("id-ID");
      addMessage(
        {
          text: data.output || JSON.stringify(data, null, 2),
          time: botTime,
          date: botDate,
        },
        "bot",
      );
      if (data.userInput && data.userInput.includes("https://"))
        updateHistoryWithURL(data.userInput);
    } catch (e) {
      removeTyping();
      const responseDuration = Date.now() - requestStartTime;
      trackGAEvent("bot_response_received", {
        response_time_ms: responseDuration,
        status: "error"
      });

      const et = new Date()
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        .replace(".", ":");
      const ed = new Date().toLocaleDateString("id-ID");
      addMessage(
        {
          text: "⚠️ Gagal terhubung ke server. Coba lagi nanti.",
          time: et,
          date: ed,
        },
        "bot",
      );
      console.error(e);
    } finally {
      isSending = false;
      updateSendBtn();
    }
  }

  // --- VOICE INPUT ---
  if (voiceBtn) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = true;

      voiceBtn.addEventListener("click", () => {
        if (isRecording) {
          recognition.stop();
          return;
        }
        try {
          recognition.start();
          isRecording = true;
          trackGAEvent("voice_input_start", { language: "id-ID" });
          voiceBtn.classList.add("is-recording");
          voiceBtn.querySelector("span").textContent = "mic";
          voiceBtn.setAttribute("aria-label", "Berhenti merekam");
        } catch (e) {
          // already started
        }
      });

      recognition.addEventListener("result", (e) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        input.value = transcript;
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 112) + "px";
        updateSendBtn();
      });

      recognition.addEventListener("end", () => {
        isRecording = false;
        voiceBtn.classList.remove("is-recording");
        voiceBtn.querySelector("span").textContent = "mic";
        voiceBtn.setAttribute("aria-label", "Rekam suara");
        if (input.value.trim()) sendMessage();
      });

      recognition.addEventListener("error", () => {
        isRecording = false;
        voiceBtn.classList.remove("is-recording");
        voiceBtn.querySelector("span").textContent = "mic";
        voiceBtn.setAttribute("aria-label", "Rekam suara");
      });
    } else {
      voiceBtn.style.display = "none";
    }
  }

  // --- CHAT EXPORT ---
  if (exportChatBtn) {
    exportChatBtn.addEventListener("click", () => {
      const messages = chatbox.querySelectorAll(".bubble");
      if (messages.length === 0) return;
      trackGAEvent("export_chat", { message_count: messages.length });
      let text = "LISA Chat Export\n";
      text += "Tanggal: " + new Date().toLocaleDateString("id-ID") + "\n";
      text += "================================\n\n";
      messages.forEach((msg) => {
        const sender = msg.classList.contains("user") ? "Anda" : "LISA";
        const timestamp = msg.querySelector(".timestamp");
        const time = timestamp ? timestamp.textContent : "";
        const content = msg.querySelector("div:first-child");
        const txt = content ? content.textContent || "[Gambar]" : "[Gambar]";
        text += "[" + time + "] " + sender + ":\n" + txt + "\n\n";
      });
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lisa-chat-" + Date.now() + ".txt";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // --- HISTORY ---
  function updateHistoryWithURL(m) {
    const u = m.match(/https?:\/\/[^\s\]]+/);
    if (!u) return;
    const s = u[0];
    const st = localStorage.getItem(HISTORY_KEY);
    if (!st) return;
    try {
      let d = JSON.parse(st);
      for (let i = d.chats.length - 1; i >= 0; i--) {
        if (
          d.chats[i].sender === "user" &&
          d.chats[i].message.text === "[Gambar dilampirkan]"
        ) {
          d.chats[i].message.text = s;
          break;
        }
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(d));
    } catch (e) {}
  }

  function saveChatHistory(message, sender) {
    const st = localStorage.getItem(HISTORY_KEY);
    let chats = [];
    if (st) {
      try {
        chats = JSON.parse(st).chats || [];
      } catch (e) {}
    }
    chats.push({ message, sender });
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ timestamp: new Date().getTime(), chats }),
    );
  }

  function loadChatHistory() {
    const st = localStorage.getItem(HISTORY_KEY);
    if (!st) return;
    try {
      const data = JSON.parse(st);
      const now = new Date().getTime();
      if (now - data.timestamp > EXPIRATION_DAYS * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(HISTORY_KEY);
        return;
      }
      if (data.chats.length > 0) hideWelcome();
      data.chats.forEach((item) => {
        if (item.message.text === "[Gambar dilampirkan]") return;
        addMessage(item.message, item.sender, false);
      });
    } catch (e) {
      console.error("Gagal memuat history chat:", e);
      localStorage.removeItem(HISTORY_KEY);
    }
  }

  // --- VISUAL VIEWPORT SYNC (iOS Safari / Mobile Keyboard) ---
  function syncAppHeight() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      syncAppHeight();
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      chatbox.scrollTop = chatbox.scrollHeight;
    });
    window.visualViewport.addEventListener("scroll", () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    });
  }
  window.addEventListener("resize", syncAppHeight);
  syncAppHeight();

  // --- EVENT LISTENERS ---
  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 112) + "px";
    updateSendBtn();
  });

  input.addEventListener("focus", () => {
    setTimeout(() => {
      syncAppHeight();
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      chatbox.scrollTop = chatbox.scrollHeight;
    }, 150);
  });
  fileInput.value = null;
  filePreview.style.display = "none";
  fileName.textContent = "";
  loadChatHistory();

  // --- SCROLL TO BOTTOM ---
  chatbox.addEventListener("scroll", () => {
    const distanceFromBottom =
      chatbox.scrollHeight - chatbox.scrollTop - chatbox.clientHeight;
    if (distanceFromBottom > 100) {
      scrollToBottomBtn.style.display = "flex";
    } else {
      scrollToBottomBtn.style.display = "none";
    }
  });
  scrollToBottomBtn.addEventListener("click", () => {
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
  });

  // --- PULL-TO-REFRESH ---
  let touchStartY = 0;
  let isPulling = false;
  let pullDistance = 0;
  let ptrIndicator = document.getElementById("ptrIndicator");

  chatbox.addEventListener("touchstart", (e) => {
    if (chatbox.scrollTop === 0) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
      pullDistance = 0;
    }
  }, { passive: true });

  chatbox.addEventListener("touchmove", (e) => {
    if (!isPulling) return;
    pullDistance = e.touches[0].clientY - touchStartY;
    if (pullDistance > 0 && ptrIndicator) {
      ptrIndicator.style.transform = "translateY(" + Math.min(pullDistance * 0.5, 60) + "px)";
      ptrIndicator.style.opacity = Math.min(pullDistance / 100, 1);
    }
  }, { passive: true });

  chatbox.addEventListener("touchend", () => {
    if (!isPulling) return;
    const shouldRefresh = pullDistance > 70;
    isPulling = false;
    pullDistance = 0;
    if (ptrIndicator) {
      ptrIndicator.style.transform = "";
      ptrIndicator.style.opacity = "";
    }
    if (shouldRefresh) {
      // Refresh by reloading chat history
      localStorage.removeItem(HISTORY_KEY);
      location.reload();
    }
  }, { passive: true });

  // --- FORM ---
  const formOverlay = document.getElementById("formOverlay");
  const formContainer = document.getElementById("formContainer");
  const closeFormBtn = document.getElementById("closeFormBtn");
  const submitFormBtn = document.getElementById("submitFormBtn");
  const formId = document.getElementById("formId");
  const formDate = document.getElementById("formDate");
  const formSaran = document.getElementById("formSaran");

  window.openForm = function () {
    formId.value = sessionId.substring(0, 8);
    formDate.value = new Date().toLocaleDateString("id-ID", {
      dateStyle: "long",
    });
    formSaran.value = "";
    formOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
    setTimeout(() => formContainer.classList.add("form-visible"), 10);
  };

  window.closeForm = function () {
    formContainer.classList.remove("form-visible");
    document.body.style.overflow = "";
    setTimeout(() => (formOverlay.style.display = "none"), 300);
  };

  closeFormBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeForm();
  });
  formOverlay.addEventListener("click", (e) => {
    if (e.target === formOverlay) closeForm();
  });

  submitFormBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const s = formSaran.value.trim();
    if (!s) {
      alert("Harap isi saran atau masukan kamu ya!");
      return;
    }
    input.value = "Saran & Masukan (ID: " + formId.value + "):\n" + s;
    closeForm();
    sendMessage();
  });

  // --- DARK MODE ---
  initDarkMode();
});
