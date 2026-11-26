/* CONTACT: stop double submits. */
(() => {
  const form = document.querySelector(".form");
  if (!form) return;
  const btn = form.querySelector("button[type=submit]");
  form.addEventListener("submit", () => {
    btn.disabled = true;
  });
  // coming back with the browser's back button re-enables the form
  window.addEventListener("pageshow", () => {
    btn.disabled = false;
  });
})();
