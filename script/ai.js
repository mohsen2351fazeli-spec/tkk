/* ZHUGEGBT chat. The API call and the persona prompt are unchanged from the
   previous version; only the interface around them was rebuilt. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const API_URL = "https://openrouter.ai/api/v1/chat/completions";
  const API_KEY =
    "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";
  const SYSTEM_PROMPT = `نام این هوش مصنوعی zhugegbt است.

این سایت درباره دوران سه پادشاهی چین (Three Kingdoms) است.
موضوعات اصلی گفتگو شامل تاریخ، شخصیت‌ها، نبردها، سیاست‌ها، روابط و وقایع دوران سه پادشاهی است.

تو باید مانند ژوگه لیانگ (诸葛亮) صحبت کنی؛
یعنی پاسخ‌هایت خردمندانه، آرام، استراتژیک و متناسب با شخصیت ژوگه لیانگ باشد.

خودت را به عنوان یک هوش مصنوعی معرفی نکن، مگر اینکه کاربر مستقیماً درباره هویتت سؤال کند.
در پاسخ‌ها از لحن ژوگه لیانگ استفاده کن، اما اطلاعات تاریخی را تا حد ممکن دقیق و واقعی ارائه بده.

اگر کاربر درباره موضوعی خارج از دوران سه پادشاهی سؤال کرد، می‌توانی پاسخ بدهی، اما همچنان با لحن ژوگه لیانگ صحبت کن.

همیشه پاسخ را به زبان کاربر بده.`;
  const ERROR_TEXT = "oops!,something wrong, please try again";

  const main = document.querySelector(".ai-main");
  const chat = document.querySelector(".chat");
  const input = document.querySelector(".field input");
  const send = document.querySelector(".send");
  const conversation = [];
  let busy = false;

  const refresh = () =>
    send.classList.toggle("is-ready", Boolean(input.value.trim()) && !busy);

  const scrollToEnd = (el) =>
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });

  const addMessage = (kind, text = "") => {
    const el = document.createElement("div");
    el.className = `msg ${kind}`;
    el.textContent = text;
    chat.append(el);
    scrollToEnd(el);
    return el;
  };

  const addPending = () => {
    const el = document.createElement("div");
    el.className = "msg bot pending";
    el.innerHTML = "<i></i><i></i><i></i>";
    el.setAttribute("aria-label", "...");
    chat.append(el);
    scrollToEnd(el);
    return el;
  };

  const typeOut = (el, text) =>
    new Promise((resolve) => {
      if (reduce) {
        el.textContent = text;
        scrollToEnd(el);
        return resolve();
      }
      const perFrame = Math.max(1, Math.ceil(text.length / 360));
      let shown = 0;
      const tick = () => {
        shown = Math.min(text.length, shown + perFrame);
        el.textContent = text.slice(0, shown);
        if (shown % (perFrame * 6) === 0) scrollToEnd(el);
        if (shown < text.length) requestAnimationFrame(tick);
        else {
          scrollToEnd(el);
          resolve();
        }
      };
      tick();
    });

  const ask = async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        max_tokens: 2000,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...conversation],
      }),
    });
    if (!response.ok) throw new Error("fetch error");
    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  };

  const submit = async () => {
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    main.classList.add("is-chatting");
    send.classList.add("is-busy");
    input.value = "";
    input.disabled = true;
    refresh();

    addMessage("user", text);
    conversation.push({ role: "user", content: text });
    const pending = addPending();

    let reply;
    try {
      reply = await ask();
    } catch (err) {
      reply = null;
    }
    pending.remove();

    if (reply) {
      conversation.push({ role: "assistant", content: reply });
      await typeOut(addMessage("bot"), reply);
    } else {
      addMessage("bot error", ERROR_TEXT);
    }

    busy = false;
    send.classList.remove("is-busy");
    input.disabled = false;
    input.focus({ preventScroll: true });
    refresh();
  };

  input.addEventListener("input", refresh);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      submit();
    }
  });
  send.addEventListener("click", submit);
})();
