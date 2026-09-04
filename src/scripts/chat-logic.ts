import { parseMarkdown, linkify } from './parser';
import { getFormattedDate, formatTime, generateUUID } from './utils';
import type { Message } from '../types/chat';

const HISTORY_KEY = 'lisaChatHistory';
const WEBHOOK_URL = import.meta.env.PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.terato.my.id/webhook/50e27e1d-f8f3-43e8-a1a8-53fa5eafecdf';

export function initChat() {
  const chatbox = document.getElementById('chatbox');
  const input = document.getElementById('userInput') as HTMLTextAreaElement | null;
  const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement | null;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
  const filePreview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const welcomeCard = document.getElementById('welcomeCard');
  const clearChatBtn = document.getElementById('clearChatBtn');

  if (!chatbox || !input || !sendBtn) return;

  let isSending = false;
  let lastMessageDate: string | null = null;

  const sessionId = localStorage.getItem('lisaSession') || generateUUID();
  localStorage.setItem('lisaSession', sessionId);

  const MAX_PHOTO_UPLOADS = 3;
  const MAX_MESSAGES_PER_SESSION = 50;
  const MAX_MESSAGES_PER_MINUTE = 12;
  const MIN_SEND_INTERVAL_MS = 1500;

  let lastSendTimestamp = 0;
  let recentMessageTimestamps: number[] = [];

  const PHOTO_COUNT_KEY = `lisaPhotoCount_${sessionId}`;
  const MSG_COUNT_KEY = `lisaMsgCount_${sessionId}`;

  function getPhotoUploadCount(): number {
    return parseInt(localStorage.getItem(PHOTO_COUNT_KEY) || '0', 10);
  }

  function incrementPhotoUploadCount(amount = 1): number {
    const current = getPhotoUploadCount();
    const updated = current + amount;
    localStorage.setItem(PHOTO_COUNT_KEY, updated.toString());
    updateUploadButtonState();
    return updated;
  }

  function getSessionMessageCount(): number {
    return parseInt(localStorage.getItem(MSG_COUNT_KEY) || '0', 10);
  }

  function incrementSessionMessageCount(): number {
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

  function getRemainingPhotoUploads(): number {
    return Math.max(0, MAX_PHOTO_UPLOADS - getPhotoUploadCount());
  }

  function checkRateLimit(): { allowed: boolean; reason?: string; waitSec?: number } {
    const now = Date.now();

    if (now - lastSendTimestamp < MIN_SEND_INTERVAL_MS) {
      return {
        allowed: false,
        reason: 'cooldown',
        waitSec: Math.ceil((MIN_SEND_INTERVAL_MS - (now - lastSendTimestamp)) / 1000),
      };
    }

    recentMessageTimestamps = recentMessageTimestamps.filter((t) => now - t < 60000);
    if (recentMessageTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
      const oldestInWindow = recentMessageTimestamps[0];
      const waitSec = Math.max(1, Math.ceil((60000 - (now - oldestInWindow)) / 1000));
      return { allowed: false, reason: 'velocity', waitSec };
    }

    if (getSessionMessageCount() >= MAX_MESSAGES_PER_SESSION) {
      return { allowed: false, reason: 'session_limit' };
    }

    return { allowed: true };
  }

  const fileInputLabel = document.querySelector('label[for="fileInput"]');

  function updateUploadButtonState() {
    const remaining = getRemainingPhotoUploads();
    if (fileInputLabel) {
      if (remaining <= 0) {
        fileInputLabel.classList.add('opacity-40', 'cursor-not-allowed');
        fileInputLabel.setAttribute(
          'title',
          `Batas upload foto (${MAX_PHOTO_UPLOADS}/${MAX_PHOTO_UPLOADS}) tercapai. Hapus chat untuk sesi baru.`,
        );
      } else {
        fileInputLabel.classList.remove('opacity-40', 'cursor-not-allowed');
        fileInputLabel.setAttribute(
          'title',
          `Upload foto (${remaining} kuota tersisa dari maks. ${MAX_PHOTO_UPLOADS})`,
        );
      }
    }
  }
  updateUploadButtonState();

  function hideWelcome() {
    if (welcomeCard) welcomeCard.style.display = 'none';
  }

  function updateSendBtn() {
    const hasText = input?.value.trim().length || 0;
    const hasFile = fileInput?.files?.length || 0;
    if (sendBtn) {
      sendBtn.disabled = !hasText && !hasFile;
    }
  }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 112) + 'px';
    updateSendBtn();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', () => {
    sendMessage();
  });

  // Quick Action Chips & Buttons delegation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const chip = target.closest('.quick-chip') as HTMLElement | null;
    if (chip && input) {
      if (isSending) return;
      const text = chip.getAttribute('data-send') || chip.textContent?.trim() || '';
      input.value = text;
      updateSendBtn();
      sendMessage();
      return;
    }

    const qrBtn = target.closest('.quick-reply-btn') as HTMLElement | null;
    if (qrBtn && input) {
      if (isSending) return;
      const text = qrBtn.getAttribute('data-value') || qrBtn.textContent?.trim() || '';
      input.value = text;
      updateSendBtn();
      sendMessage();
    }
  });

  // Clear Chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (confirm('Hapus seluruh riwayat percakapan?')) {
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem('lisaSession');
        resetPhotoUploadCount();
        location.reload();
      }
    });
  }

  // File Upload handling
  if (fileInput && filePreview && fileName && removeFileBtn) {
    fileInput.addEventListener('click', (e) => {
      const remaining = getRemainingPhotoUploads();
      if (remaining <= 0) {
        e.preventDefault();
        alert(
          `⚠️ Batas kuota upload foto per sesi telah tercapai (maksimal ${MAX_PHOTO_UPLOADS} foto per sesi).\n\nKamu tetap bisa berkonsultasi via teks, atau bersihkan riwayat chat untuk memulai sesi baru.`,
        );
      }
    });

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      const remaining = getRemainingPhotoUploads();

      if (files.length > remaining) {
        alert(
          `⚠️ Kamu memilih ${files.length} foto, tetapi sisa kuota sesi ini hanya ${remaining} foto (maks. ${MAX_PHOTO_UPLOADS} foto per sesi).\n\nSilakan pilih foto lebih sedikit atau bersihkan riwayat chat.`,
        );
        fileInput.value = '';
        updateFilePreview();
        updateSendBtn();
        return;
      }

      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          alert(`⚠️ File "${f.name}" melebihi batas ukuran 5MB.`);
          fileInput.value = '';
          updateFilePreview();
          updateSendBtn();
          return;
        }
      }

      updateFilePreview();
      updateSendBtn();
    });

    removeFileBtn.addEventListener('click', () => {
      fileInput.value = '';
      filePreview.classList.add('hidden');
      filePreview.classList.remove('flex');
      fileName.textContent = '';
      updateSendBtn();
    });
  }

  function updateFilePreview() {
    if (fileInput && filePreview && fileName) {
      const files = fileInput.files;
      if (files && files.length > 0) {
        const names = Array.from(files).map((f) => f.name).join(', ');
        const remaining = getRemainingPhotoUploads();
        fileName.textContent = `${names} (${files.length} foto — sisa kuota sesi: ${remaining - files.length})`;
        filePreview.classList.remove('hidden');
        filePreview.classList.add('flex');
      } else {
        filePreview.classList.add('hidden');
        filePreview.classList.remove('flex');
        fileName.textContent = '';
      }
    }
  }

  function renderMessage(message: Message, save = true) {
    hideWelcome();
    const text = message.text.trim();

    // Parse quick reply tags [BUTTONS: label1|val1, label2|val2]
    const qrMatch = text.match(/\[(BUTTONS|QR):(.+?)\]$/i);
    let qrData: Array<{ label: string; value: string }> | null = null;
    let cleanText = text;
    if (qrMatch) {
      qrData = qrMatch[2].split(',').map((pair) => {
        const [label, value] = pair.split('|');
        return { label: label.trim(), value: (value || label).trim() };
      });
      cleanText = text.replace(/\[(BUTTONS|QR):.+?\]$/i, '').trim();
    }

    // Date separator
    if (message.date !== lastMessageDate) {
      const dateSep = document.createElement('div');
      dateSep.className = 'flex justify-center my-3';
      dateSep.innerHTML = `<span class="px-3 py-1 bg-surface-container text-outline text-[11px] font-semibold rounded-full border border-outline-variant/30">${getFormattedDate(message.date)}</span>`;
      chatbox.appendChild(dateSep);
      lastMessageDate = message.date;
    }

    const row = document.createElement('div');
    row.className = `msg-row ${message.sender}`;

    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col max-w-[85%] sm:max-w-[75%]';
    if (message.sender === 'user') wrap.classList.add('items-end');
    else wrap.classList.add('items-start');

    const bubble = document.createElement('div');
    bubble.className = `bubble ${message.sender}`;

    const content = document.createElement('div');
    if (message.sender === 'bot') {
      content.innerHTML = parseMarkdown(cleanText);
    } else {
      content.innerHTML = linkify(cleanText);
    }
    bubble.appendChild(content);

    // Render quick reply buttons inside bubble
    if (qrData && qrData.length > 0) {
      const qrContainer = document.createElement('div');
      qrContainer.className = 'quick-reply-container';
      qrData.forEach((qr) => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.setAttribute('data-value', qr.value);
        btn.textContent = qr.label;
        qrContainer.appendChild(btn);
      });
      bubble.appendChild(qrContainer);
    }

    wrap.appendChild(bubble);

    const timeEl = document.createElement('span');
    timeEl.className = 'msg-time';
    timeEl.textContent = message.time;
    wrap.appendChild(timeEl);

    if (message.sender === 'bot') {
      const avatar = document.createElement('img');
      avatar.src = 'https://files.lingkungansehatasri.my.id/lisa-profile-picture.jpg';
      avatar.alt = 'LISA';
      avatar.className = 'w-8 h-8 rounded-full border border-primary/20 shrink-0 mt-1 shadow-sm';
      row.appendChild(avatar);
    }

    row.appendChild(wrap);
    chatbox.appendChild(row);
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: 'smooth' });

    if (save) {
      saveHistory(message);
    }
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typingIndicator';

    const avatar = document.createElement('img');
    avatar.src = 'https://files.lingkungansehatasri.my.id/lisa-profile-picture.jpg';
    avatar.alt = 'LISA';
    avatar.className = 'w-8 h-8 rounded-full border border-primary/20 shrink-0 mt-1 shadow-sm';
    row.appendChild(avatar);

    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col items-start';

    const bubble = document.createElement('div');
    bubble.className = 'bubble bot';
    bubble.innerHTML = '<div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';

    wrap.appendChild(bubble);
    row.appendChild(wrap);
    chatbox.appendChild(row);
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: 'smooth' });
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  function saveHistory(message: Message) {
    try {
      const history: Message[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push(message);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }

  function loadHistory() {
    try {
      const history: Message[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (history.length > 0) {
        hideWelcome();
        history.forEach((msg) => renderMessage(msg, false));
      }
    } catch {
      // ignore parse errors
    }
  }

  async function sendMessage() {
    if (isSending) return;
    const text = input?.value.trim() || '';
    const file = fileInput?.files?.[0];

    if (!text && !file) return;

    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      if (rateCheck.reason === 'cooldown') {
        return;
      } else if (rateCheck.reason === 'velocity') {
        alert(
          `⏳ Kamu mengetik terlalu cepat. Silakan tunggu ${rateCheck.waitSec} detik sebelum mengirim pesan berikutnya ya 😊`,
        );
        return;
      } else if (rateCheck.reason === 'session_limit') {
        alert(
          `⚠️ Batas kuota percakapan untuk sesi ini (${MAX_MESSAGES_PER_SESSION} pesan) telah tercapai.\n\nSilakan klik ikon tempat sampah di pojok kanan atas untuk menghapus riwayat chat dan memulai sesi baru.`,
        );
        return;
      }
    }

    lastSendTimestamp = Date.now();
    recentMessageTimestamps.push(lastSendTimestamp);
    incrementSessionMessageCount();

    isSending = true;
    const now = new Date();
    const currentDate = now.toLocaleDateString('id-ID');
    const currentTime = formatTime(now);

    const userMessage: Message = {
      text,
      sender: 'user',
      date: currentDate,
      time: currentTime,
    };

    renderMessage(userMessage, true);

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    if (fileInput && filePreview && fileName) {
      fileInput.value = '';
      filePreview.classList.add('hidden');
      filePreview.classList.remove('flex');
      fileName.textContent = '';
    }
    updateSendBtn();

    addTyping();

    try {
      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('text', text);
        formData.append('chatInput', text);
        formData.append('file', file);
        formData.append('file0', file);
        incrementPhotoUploadCount(1);
        response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, chatInput: text }),
        });
      }

      removeTyping();

      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();
      const botReply = data.output || data.response || data.text || 'Maaf, LISA sedang tidak bisa merespons saat ini.';

      const botMessage: Message = {
        text: botReply,
        sender: 'bot',
        date: new Date().toLocaleDateString('id-ID'),
        time: formatTime(new Date()),
      };

      renderMessage(botMessage, true);
    } catch {
      removeTyping();
      const errMessage: Message = {
        text: '⚠️ Maaf, gagal terhubung ke server LISA. Coba lagi dalam beberapa saat ya.',
        sender: 'bot',
        date: new Date().toLocaleDateString('id-ID'),
        time: formatTime(new Date()),
      };
      renderMessage(errMessage, false);
    } finally {
      isSending = false;
      updateSendBtn();
    }
  }

  loadHistory();
}
