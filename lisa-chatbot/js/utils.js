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
}

/**
 * Dark mode toggle
 */
function initDarkMode() {
  const stored = localStorage.getItem("lisaDarkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = stored !== null ? stored === "true" : prefersDark;
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  return isDark;
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
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n/g, "<br>");
  // Then apply linkify
  return linkify(html);
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getFormattedDate, formatTime, debounce, getLang, setLang, initDarkMode, toggleDarkMode, linkify, parseMarkdown };
}
