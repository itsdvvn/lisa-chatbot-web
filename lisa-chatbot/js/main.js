document.addEventListener("DOMContentLoaded", function () {
  // --- INIT ---
  initDarkMode();
  loadTranslations();

  // --- SCROLL REVEAL ---
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { root: null, rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });

  // --- COUNTER ANIMATION ---
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-target"));
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".counter-value").forEach((el) => counterObserver.observe(el));

  function animateCounter(el, target) {
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString("id-ID");
    }, 16);
  }

  // --- NAVIGATION ---
  window.navigateTo = function (viewId) {
    const homeView = document.getElementById("view-home");
    const mediaKitView = document.getElementById("view-mediakit");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (viewId === "mediakit") {
      homeView.classList.add("hidden-spa");
      mediaKitView.classList.remove("hidden-spa");
    } else {
      mediaKitView.classList.add("hidden-spa");
      homeView.classList.remove("hidden-spa");
    }
  };

  // --- DOCUMENT PREVIEW ---
  const docModal = document.getElementById("docPreviewModal");
  const docFrame = document.getElementById("docPreviewFrame");
  const docTitle = document.getElementById("docPreviewTitle");
  window.openDocPreview = function (url, title) {
    docTitle.innerText = title;
    docFrame.src = "https://docs.google.com/viewer?url=" + encodeURIComponent(url) + "&embedded=true";
    docModal.classList.add("active");
    document.body.style.overflow = "hidden";
  };
  window.closeDocPreview = function () {
    docModal.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(function () { docFrame.src = ""; }, 300);
  };
  if (docModal) {
    docModal.addEventListener("click", function (e) {
      if (e.target === docModal) closeDocPreview();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDocPreview();
    });
  }

  // --- SCROLL TO TOP ---
  const scrollBtn = document.getElementById("scrollToTopBtn");
  if (scrollBtn) {
    window.addEventListener("scroll", function () {
      scrollBtn.classList.toggle("show", window.scrollY > 300);
    });
    scrollBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- DARK MODE TOGGLE ---
  const darkToggle = document.getElementById("darkModeToggle");
  if (darkToggle) {
    darkToggle.addEventListener("click", toggleDarkMode);
  }

  // --- LANGUAGE TOGGLE ---
  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", function () {
      const current = getLang();
      const next = current === "id" ? "en" : "id";
      setLang(next);
      langToggle.textContent = next === "id" ? "EN" : "ID";
    });
    langToggle.textContent = getLang() === "id" ? "EN" : "ID";
  }

  // --- FEEDBACK MODAL ---
  const subscribeTrigger = document.getElementById("subscribeTrigger");
  const subModal = document.getElementById("subModal");
  const closeSubModalBtn = document.getElementById("closeSubModal");
  const subForm = document.getElementById("subscribeForm");
  if (subscribeTrigger && subModal) {
    subscribeTrigger.addEventListener("click", function () {
      subModal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    if (closeSubModalBtn) {
      closeSubModalBtn.addEventListener("click", function () {
        subModal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
    subModal.addEventListener("click", function (e) {
      if (e.target === subModal) {
        subModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && subModal.classList.contains("active")) {
        subModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
  if (subForm) {
    subForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = subForm.querySelector('input[name="email"]').value;
      const feedback = subForm.querySelector('textarea[name="feedback"]').value;
      const submitBtn = subForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin inline-block align-middle mr-2 text-[20px]">progress_activity</span>Mengirim...';
      submitBtn.classList.add("opacity-70", "cursor-not-allowed");
      fetch("https://n8n.terato.my.id/webhook/56e0a50d-c505-4ad4-b1a2-f9af17761ce2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feedback, source: "LISA_Landing_Page_Feedback", timestamp: new Date().toISOString() })
      })
        .then(function (r) {
          if (r.ok) {
            alert("Terima kasih! Masukan kamu sudah kami terima.");
            subModal.classList.remove("active");
            subForm.reset();
            document.body.style.overflow = "";
          } else alert("Terjadi kesalahan. Coba lagi.");
        })
        .catch(function () { alert("Gagal menghubungi server. Periksa koneksi internetmu."); })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
          submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        });
    });
  }

  // --- PARALLAX HERO ---
  window.addEventListener("scroll", function () {
    const heroBg = document.querySelector(".hero-bg-mask img");
    if (heroBg) {
      const scrolled = window.scrollY;
      heroBg.style.transform = "translateY(" + scrolled * 0.3 + "px)";
    }
  }, { passive: true });

  // --- PWA INSTALL ---
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("installAppBtn");
    if (installBtn) installBtn.style.display = "flex";
  });
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      }
    });
  }

  // --- SERVICE WORKER REGISTRATION ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  // --- SKIP LINK ---
  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", function (e) {
      e.preventDefault();
      const main = document.querySelector("main");
      if (main) main.setAttribute("tabindex", "-1");
      if (main) main.focus();
    });
  }
});

// --- TRANSLATIONS ---
async function loadTranslations() {
  const lang = getLang();
  const locales = ["id", "en"];
  window.translations = window.translations || {};
  for (const code of locales) {
    try {
      const res = await fetch("locales/" + code + ".json");
      if (res.ok) {
        window.translations[code] = await res.json();
      }
    } catch (e) {}
  }
  setLang(lang);
}

// --- I18N HELPER ---
function t(key) {
  const lang = getLang();
  if (window.translations && window.translations[lang] && window.translations[lang][key]) {
    return window.translations[lang][key];
  }
  return key;
}
