/* PERSONS: filter the roster by name. */
(() => {
  const input = document.querySelector(".search input");
  const cards = [...document.querySelectorAll(".pcard")];
  const none = document.querySelector(".none");
  if (!input || !cards.length) return;

  const norm = (s) =>
    s
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/‌/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  cards.forEach((card) => {
    card.dataset.q = norm(card.querySelector("h2").textContent);
  });

  const apply = () => {
    const q = norm(input.value);
    let shown = 0;
    cards.forEach((card) => {
      const hit = !q || card.dataset.q.includes(q);
      card.hidden = !hit;
      if (hit) shown++;
    });
    none.classList.toggle("is-hidden", shown > 0);
  };

  input.addEventListener("input", apply);
  apply();
})();
