/* Shared by every page: cache worker, compact header on scroll + mobile menu. */
(() => {
  /* sw.js sits in the site root; it keeps images and fonts for repeat visits. */
  if ("serviceWorker" in navigator && document.currentScript) {
    const worker = new URL("../sw.js", document.currentScript.src);
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(worker).catch(() => {});
    });
  }

  const header = document.querySelector(".site-header");
  const btn = document.querySelector(".menu-btn");
  const panel = document.querySelector(".menu-panel");

  if (header) {
    const onScroll = () => header.classList.toggle("is-compact", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (!btn || !panel) return;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      const first = panel.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  };

  btn.addEventListener("click", () => setOpen(btn.getAttribute("aria-expanded") !== "true"));
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
      btn.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (m) => {
    if (m.matches) setOpen(false);
  });
})();
