const CACHE_NAME = "lisa-v1";
const STATIC_URLS = [
  "/lisa-chatbot/",
  "/lisa-chatbot/index.html",
  "/lisa-chatbot/chat/index.html",
  "/lisa-chatbot/css/style.css",
  "/lisa-chatbot/css/chat.css",
  "/lisa-chatbot/js/main.js",
  "/lisa-chatbot/js/chat.js",
  "/lisa-chatbot/js/utils.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes("/webhook/")) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ output: "⚠️ Kamu sedang offline. Coba lagi nanti." }), { headers: { "Content-Type": "application/json" } })));
  } else if (url.origin === "https://cdn.tailwindcss.com" || url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })),
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
  }
});
