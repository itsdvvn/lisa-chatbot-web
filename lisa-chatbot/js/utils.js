// Shared utility functions for LISA website

/**
 * Format a date string to localized format
 */
function getFormattedDate(dateString) {
  const today = new Date().toLocaleDateString("id-ID");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("id-ID");
  if (dateString === today) return "Hari Ini";
  if (dateString === yesterday) return "Kemarin";
  return dateString;
}

/**
 * Format time consistently
 */
function formatTime(date) {
  return date
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
}

/**
 * Debounce function
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * i18n: Get current language
 */
function getLang() {
  return localStorage.getItem("lisaLang") || "id";
}

/**
 * i18n: Set language and reload translations
 */
function setLang(lang) {
  localStorage.setItem("lisaLang", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (window.translations && window.translations[lang] && window.translations[lang][key]) {
      el.textContent = window.translations[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (window.translations && window.translations[lang] && window.translations[lang][key]) {
      el.placeholder = window.translations[lang][key];
    }
  });
}

/**
 * Dark mode toggle
 */
function initDarkMode() {
  const stored = localStorage.getItem("lisaDarkMode");
  if (stored !== null) {
    const isDark = stored === "true";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    return isDark;
  }
  return false;
}

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("lisaDarkMode", "false");
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("lisaDarkMode", "true");
  }
}

/**
 * Linkify text (URLs, bold, images, videos)
 */
function linkify(text) {
  let processedText = text.replace(/\n/g, "<br>");
  processedText = processedText.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  return processedText.replace(urlRegex, function (url) {
    if (url.includes('href="') || url.includes('src="')) return url;
    let href = url;
    if (url.startsWith("www.")) href = "http://" + url;
    if (url.startsWith("https://files.lingkungansehatasri.my.id") && (url.includes(".mp4") || url.includes(".webm"))) {
      return '<video controls playsinline preload="metadata" style="width:100%;max-width:280px;border-radius:10px;display:block;margin-top:8px;"><source src="' + url + '" type="video/mp4"></video>';
    }
    if (url.startsWith("https://files.lingkungansehatasri.my.id") && (url.includes(".jpg") || url.includes(".png"))) {
      return '<img src="' + url + '" alt="Lampiran" style="width:100%;max-width:250px;border-radius:10px;display:block;margin-top:8px;">';
    }
    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:#006c4b;text-decoration:underline;">' + url + "</a>";
  });
}

/**
 * Simple Markdown parser (subset)
 */
function parseMarkdown(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm sm:text-base my-1.5 text-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-base sm:text-lg my-2 text-primary">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg sm:text-xl my-2.5 text-primary">$1</h1>');

  // Bold, italic, inline code
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-xs font-mono">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-primary pl-3 my-2 italic text-outline">$1</blockquote>');

  // Process lines for numbered choices vs bullet items vs normal paragraphs
  const lines = html.split("\n");
  const result = [];
  let inMenu = false;
  let inUl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const numMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);

    if (numMatch) {
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      if (!inMenu) {
        result.push('<div class="chat-menu-group">');
        inMenu = true;
      }
      const num = numMatch[1];
      const label = numMatch[2];
      result.push(
        `<div class="chat-menu-item" data-option="${num}" title="Pilih opsi ${num}">` +
          `<span class="chat-menu-num">${num}</span>` +
          `<span class="chat-menu-text">${label}</span>` +
          `<span class="material-symbols-outlined chat-menu-arrow">chevron_right</span>` +
        `</div>`
      );
    } else if (bulletMatch) {
      if (inMenu) {
        result.push("</div>");
        inMenu = false;
      }
      if (!inUl) {
        result.push('<ul class="chat-ul">');
        inUl = true;
      }
      result.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inMenu) {
        result.push("</div>");
        inMenu = false;
      }
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      result.push(line);
    }
  }

  if (inMenu) result.push("</div>");
  if (inUl) result.push("</ul>");

  let parsed = result.join("\n");
  // Clean up extra blank lines around menu groups and lists
  parsed = parsed.replace(/<\/div>\n+/g, "</div>");
  parsed = parsed.replace(/<div class="chat-menu-group">\n+/g, '<div class="chat-menu-group">');
  parsed = parsed.replace(/<\/ul>\n+/g, "</ul>");
  parsed = parsed.replace(/<ul class="chat-ul">\n+/g, '<ul class="chat-ul">');

  // Convert paragraph gaps and newlines
  parsed = parsed.replace(/\n{2,}/g, '<div class="my-1.5"></div>');
  parsed = parsed.replace(/\n/g, "<br>");

  return linkify(parsed);
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getFormattedDate, formatTime, debounce, getLang, setLang, initDarkMode, toggleDarkMode, linkify, parseMarkdown };
}
