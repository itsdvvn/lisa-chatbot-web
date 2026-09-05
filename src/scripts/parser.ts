/**
 * Renders rich link, video player, image, or Google Maps button.
 */
export function renderLinkOrMedia(label: string, url: string): string {
  let href = url.trim();
  if (href.startsWith("www.")) href = "https://" + href;

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
      ? `<div class="chat-video-credit">
          <span class="material-symbols-outlined text-[13px] opacity-70">smart_display</span>
          <span>Sumber: <strong>${credit}</strong></span>
        </div>`
      : "";

    return `<div class="chat-video-card">
      <div class="chat-video-header">
        <span class="material-symbols-outlined text-primary text-[18px]">play_circle</span>
        <span class="chat-video-title">${title}</span>
      </div>
      <video controls playsinline preload="metadata" class="chat-video-player">
        <source src="${href}" type="video/mp4">Browser kamu belum support pemutar video.
      </video>
      ${creditHtml}
    </div>`;
  }

  // 2. Images (.jpg, .png, .jpeg, .webp)
  if (
    href.includes(".jpg") ||
    href.includes(".png") ||
    href.includes(".jpeg") ||
    href.includes(".webp")
  ) {
    return `<img src="${href}" alt="${label || "Foto"}" class="chat-embedded-img" loading="lazy">`;
  }

  // 3. Google Maps links
  if (
    href.includes("maps.app.goo.gl") ||
    href.includes("share.google") ||
    href.includes("google.com/maps")
  ) {
    const btnText = label && !label.startsWith("http") ? label : "Buka di Google Maps";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-maps-btn">
      <span class="material-symbols-outlined text-[16px] text-red-500">location_on</span>
      <span>${btnText}</span>
      <span class="material-symbols-outlined text-[14px]">open_in_new</span>
    </a>`;
  }

  // 4. Regular hyperlink
  const displayLabel = label || href;
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-link">
    <span>${displayLabel}</span>
    <span class="material-symbols-outlined text-[14px]">open_in_new</span>
  </a>`;
}

/**
 * Linkify raw URLs in text that are not part of tags
 */
export function linkify(text: string): string {
  const urlRegex = /(?<!href="|src=")(https?:\/\/[^\s<>"]+)/gi;
  return text.replace(urlRegex, function (url) {
    return renderLinkOrMedia("", url);
  });
}

/**
 * Enhanced Markdown parser with lists, blockquotes, headings, bold/italics, and custom tags
 */
export function parseMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Markdown links: [label](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
    function (_, label, url) {
      return renderLinkOrMedia(label, url);
    }
  );

  // Headings
  html = html
    .replace(
      /^### (.+)$/gm,
      '<h3 class="font-bold text-sm sm:text-base my-1.5 text-primary">$1</h3>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="font-bold text-base sm:text-lg my-2 text-primary">$1</h2>'
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 class="font-bold text-lg sm:text-xl my-2.5 text-primary">$1</h1>'
    );

  // Bold, italic, inline code
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-xs font-mono">$1</code>'
    )
    .replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-primary pl-3 my-2 italic text-outline">$1</blockquote>'
    );

  // Process lines for numbered lists vs bullet items vs normal paragraphs
  const lines = html.split("\n");
  const result: string[] = [];
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
  parsed = parsed.replace(/<\/div>\n+/g, "</div>");
  parsed = parsed.replace(
    /<div class="chat-menu-group">\n+/g,
    '<div class="chat-menu-group">'
  );
  parsed = parsed.replace(/<\/ul>\n+/g, "</ul>");
  parsed = parsed.replace(/<ul class="chat-ul">\n+/g, '<ul class="chat-ul">');

  parsed = parsed.replace(/\n{2,}/g, '<div class="my-1.5"></div>');
  parsed = parsed.replace(/\n/g, "<br>");

  return linkify(parsed);
}
