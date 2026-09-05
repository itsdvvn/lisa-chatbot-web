// Shared utility functions for LISA website

/**
 * Helper to safely trigger Google Analytics (GA4) Custom Events
 */
function trackGAEvent(eventName, eventParams = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, eventParams);
    } catch (err) {
      console.warn("GA Event error:", err);
    }
  }
}

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
  // Strict default: LIGHT mode for all new visitors/devices
  const isDark = stored === "true";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
    if (stored === null) {
      localStorage.setItem("lisaDarkMode", "false");
    }
  }
  return isDark;
}

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  if (isDark) {
    html.removeAttribute("data-theme");
    html.classList.remove("dark");
    localStorage.setItem("lisaDarkMode", "false");
  } else {
    html.setAttribute("data-theme", "dark");
    html.classList.add("dark");
    localStorage.setItem("lisaDarkMode", "true");
  }
}

/**
 * Helper to render media, maps, or rich links
 */
function renderLinkOrMedia(label, url) {
  let href = url.trim();
  if (href.startsWith("www.")) href = "http://" + href;

  // 1. Video files (.mp4, .webm)
  if (href.includes(".mp4") || href.includes(".webm")) {
    let title = label && !label.startsWith("http") ? label : "Video Tutorial";
    let credit = "";

    // Extract creator from title if provided like "[Video Tutorial](url) (Sumber: ...)" or from filename
    const creditMatch = title.match(/(?:sumber|kredit|credit|by|creator)\s*:\s*([^)]+)/i);
    if (creditMatch) {
      credit = creditMatch[1].trim();
      title = title.replace(/\s*\([^)]*(?:sumber|kredit|credit|by|creator)[^)]*\)/gi, "").trim();
    } else {
      // Fallback: extract from R2 filename pattern e.g. PlasticBottlePET_BotolPlastikAirMineral_Anorganik_YoutubeRezarisaGATARI.mp4
      const filenameMatch = href.match(/([^\/]+)\.(?:mp4|webm)/i);
      if (filenameMatch) {
        const rawName = decodeURIComponent(filenameMatch[1]);
        const parts = rawName.split("_");
        if (parts.length >= 4) {
          const lastPart = parts[parts.length - 1];
          // Format e.g. YoutubeRezarisaGATARI -> Youtube: Rezarisa GATARI
          credit = lastPart.replace(/^(Youtube|Tiktok|TikTok)/i, "$1: ").trim();
        }
      }
    }

    const creditHtml = credit
      ? `<div class="chat-video-credit">` +
          `<span class="material-symbols-outlined text-[13px] opacity-70">smart_display</span>` +
          `<span>Sumber: <strong>${credit}</strong></span>` +
        `</div>`
      : "";

    return `<div class="chat-video-card">` +
      `<div class="chat-video-header">` +
        `<span class="material-symbols-outlined text-primary text-[18px]">play_circle</span>` +
        `<span class="chat-video-title">${title}</span>` +
      `</div>` +
      `<video controls playsinline preload="metadata" class="chat-video-player">` +
        `<source src="${href}" type="video/mp4">Browser kamu belum support pemutar video.` +
      `</video>` +
      creditHtml +
    `</div>`;
  }

  // 2. Images (.jpg, .png, .jpeg, .webp)
  if (href.includes(".jpg") || href.includes(".png") || href.includes(".jpeg") || href.includes(".webp")) {
    return `<img src="${href}" alt="${label || 'Foto'}" class="chat-embedded-img" loading="lazy">`;
  }

  // 3. Google Maps links
  if (href.includes("maps.app.goo.gl") || href.includes("share.google") || href.includes("google.com/maps")) {
    const btnText = label && !label.startsWith("http") ? label : "Buka di Google Maps";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" onclick="trackGAEvent('action_maps_click', { destination_url: '${href}' })" class="chat-maps-btn">` +
      `<span class="material-symbols-outlined text-[16px] text-red-500">location_on</span>` +
      `<span>${btnText}</span>` +
      `<span class="material-symbols-outlined text-[14px]">open_in_new</span>` +
    `</a>`;
  }

  // 4. Regular hyperlink
  const displayLabel = label || href;
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" onclick="trackGAEvent('chat_link_click', { link_url: '${href}', link_label: '${displayLabel}' })" class="chat-link">` +
    `<span>${displayLabel}</span>` +
    `<span class="material-symbols-outlined text-[14px]">open_in_new</span>` +
  `</a>`;
}

/**
 * Linkify raw URLs in text that are not part of tags
 */
function linkify(text) {
  const urlRegex = /(?<!href="|src=")(https?:\/\/[^\s<>"]+)/gi;
  return text.replace(urlRegex, function (url) {
    return renderLinkOrMedia("", url);
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

  // Markdown links: [label](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, function (_, label, url) {
    return renderLinkOrMedia(label, url);
  });

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

  // Process lines for numbered lists vs bullet items vs normal paragraphs
  const lines = html.split("\n");
  const result = [];
  let inOl = false;
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
      if (!inOl) {
        result.push('<ol class="chat-ol">');
        inOl = true;
      }
      result.push(`<li>${numMatch[2]}</li>`);
    } else if (bulletMatch) {
      if (inOl) {
        result.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul class="chat-ul">');
        inUl = true;
      }
      result.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inOl) {
        result.push("</ol>");
        inOl = false;
      }
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      result.push(line);
    }
  }

  if (inOl) result.push("</ol>");
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
  module.exports = { trackGAEvent, getFormattedDate, formatTime, debounce, getLang, setLang, initDarkMode, toggleDarkMode, linkify, parseMarkdown };
}
