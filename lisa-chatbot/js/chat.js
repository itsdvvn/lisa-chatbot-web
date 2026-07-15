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

  const sessionId =
    localStorage.getItem("lisaSession") || crypto.randomUUID();
  localStorage.setItem("lisaSession", sessionId);

  // --- SUGGESTION CHIPS ---
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.getAttribute("data-suggestion");
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
      updateSendBtn();
      sendMessage();
    });
  });

  // --- QUICK REPLY BUTTONS (dynamic) ---
  document.addEventListener("click", function (e) {
    const qr = e.target.closest(".quick-reply-btn");
    if (qr) {
      input.value = qr.getAttribute("data-value");
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
    localStorage.removeItem(HISTORY_KEY);
    location.reload();
  });

  // --- FILE INPUT ---
  fileInput.addEventListener("change", () => {
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
      fileName.textContent = names;
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
    // Check for quick reply format: [QR:label1|value1,label2|value2]
    const qrMatch = text.match(/\[QR:(.+?)\]$/);
    let qrData = null;
    let cleanText = text;
    if (qrMatch) {
      qrData = qrMatch[1].split(",").map((pair) => {
        const [label, value] = pair.split("|");
        return { label: label.trim(), value: (value || label).trim() };
      });
      cleanText = text.replace(/\[QR:.+?\]$/, "").trim();
    }

    if (message.date !== lastMessageDate) {
      const dateSep = document.createElement("div");
      dateSep.classList.add("date-separator");
      dateSep.textContent = getFormattedDate(message.date);
      chatbox.appendChild(dateSep);
      lastMessageDate = message.date;
    }
    const msg = document.createElement("div");
    msg.classList.add(
      "bubble",
      sender,
      "py-1.5",
      "px-3",
      "mb-2",
      "w-fit",
      "max-w-[85%]",
      "sm:max-w-[70%]",
      "text-sm",
      "leading-relaxed",
      "relative",
    );
    if (sender === "user") msg.classList.add("ml-auto");
    else msg.classList.add("mr-auto");

    const content = document.createElement("div");
    if (typeof text === "string" && text.startsWith("data:image/")) {
      content.innerHTML =
        '<img src="' +
        text +
        '" alt="Lampiran gambar" style="max-width:200px;border-radius:8px;display:block">';
      msg.style.padding = "8px";
    } else if (typeof text === "string" && text.startsWith("data:application/")) {
      content.innerHTML =
        '<div class="flex items-center gap-2 text-primary"><span class="material-symbols-outlined">description</span> Dokumen terlampir</div>';
      msg.style.padding = "8px";
    } else {
      // Use Markdown parser for bot messages, linkify for user
      if (sender === "bot") {
        content.innerHTML = parseMarkdown(cleanText || text);
      } else {
        content.innerHTML = linkify(cleanText || text);
      }
    }
    msg.appendChild(content);

    const timeContent = document.createElement("span");
    timeContent.classList.add("timestamp", "block", "text-[10px]", "mt-1.5");
    timeContent.textContent = message.time;
    msg.appendChild(timeContent);

    // Quick reply buttons
    if (qrData && qrData.length > 0) {
      const qrContainer = document.createElement("div");
      qrContainer.classList.add("quick-reply", "mt-2", "flex", "flex-wrap", "gap-1.5");
      qrData.forEach((qr) => {
        const btn = document.createElement("button");
        btn.classList.add(
          "quick-reply-btn",
          "px-3",
          "py-1.5",
          "text-xs",
          "font-semibold",
          "rounded-full",
          "border",
          "border-primary",
          "text-primary",
          "bg-white",
          "hover:bg-primary",
          "hover:text-white",
          "transition-colors",
          "active:scale-95",
          "cursor-pointer",
        );
        btn.setAttribute("data-value", qr.value);
        btn.textContent = qr.label;
        qrContainer.appendChild(btn);
      });
      msg.appendChild(qrContainer);
    }

    const isScrolledToBottom =
      chatbox.scrollHeight - chatbox.clientHeight <=
      chatbox.scrollTop + 100;
    chatbox.appendChild(msg);
    if (isScrolledToBottom)
      chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
    if (text.startsWith("Saran & Masukan (ID:")) save = false;
    if (save) saveChatHistory(message, sender);
  }

  // --- TYPING INDICATOR ---
  function addTyping() {
    const wrap = document.createElement("div");
    wrap.classList.add("bubble", "bot", "mr-auto", "px-4", "py-3", "mb-2");
    wrap.id = "typing";
    wrap.innerHTML =
      '<div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    chatbox.appendChild(wrap);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
  }

  // --- SEND MESSAGE ---
  async function sendMessage() {
    const text = input.value.trim();
    const files = fileInput.files;
    if (!text && files.length === 0) return;
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

    const formData = new FormData();
    formData.append("text", text);
    formData.append("sessionId", sessionId);

    // Multi-file upload
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
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
      }
      fileInput.value = null;
    }

    addTyping();
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      removeTyping();
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

  // --- EVENT LISTENERS ---
  sendBtn.addEventListener("click", sendMessage);
  const isMobile = /Mobi/i.test(navigator.userAgent);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey || isMobile) return;
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
      input.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  });
  window.addEventListener("resize", () => {
    if (document.activeElement === input)
      setTimeout(
        () =>
          input.scrollIntoView({ behavior: "smooth", block: "end" }),
        200,
      );
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
  let ptrIndicator = document.getElementById("ptrIndicator");

  chatbox.addEventListener("touchstart", (e) => {
    if (chatbox.scrollTop === 0) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });

  chatbox.addEventListener("touchmove", (e) => {
    if (!isPulling) return;
    const diff = e.touches[0].clientY - touchStartY;
    if (diff > 0 && ptrIndicator) {
      ptrIndicator.style.transform = "translateY(" + Math.min(diff * 0.5, 60) + "px)";
      ptrIndicator.style.opacity = Math.min(diff / 100, 1);
    }
  }, { passive: true });

  chatbox.addEventListener("touchend", () => {
    if (!isPulling) return;
    isPulling = false;
    if (ptrIndicator) {
      ptrIndicator.style.transform = "";
      ptrIndicator.style.opacity = "";
    }
    // Refresh by reloading chat history
    localStorage.removeItem(HISTORY_KEY);
    location.reload();
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
