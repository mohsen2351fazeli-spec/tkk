/* EPISODES: filter the 95 tickets by Persian name or by number. */
(() => {
  const input = document.querySelector(".search input");
  const list = document.querySelector(".episodes");
  const none = document.querySelector(".none");
  if (!input || !list) return;

  const items = [...list.children];
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const AR = "٠١٢٣٤٥٦٧٨٩";
  const norm = (s) =>
    s
      .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
      .replace(/[٠-٩]/g, (d) => AR.indexOf(d))
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/‌/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  items.forEach((li) => {
    li.dataset.q = norm(li.querySelector(".tt").textContent);
  });

  const apply = () => {
    const q = norm(input.value);
    let shown = 0;
    items.forEach((li) => {
      const hit = !q || (/^\d+$/.test(q) ? li.dataset.no === q : li.dataset.q.includes(q));
      li.hidden = !hit;
      if (hit) shown++;
    });
    none.classList.toggle("is-hidden", shown > 0);
  };

  input.addEventListener("input", apply);
  apply();
})();
