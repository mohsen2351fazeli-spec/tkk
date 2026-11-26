/* HOME: hero, timeline, throne parallax, music player. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ hero */
  const hero = document.querySelector(".hero");
  if (hero) {
    const slides = [...hero.querySelectorAll(".slide")];
    const dots = [...hero.querySelectorAll(".dot")];
    const DURATION = 5000;
    let current = 0;
    let timer = 0;

    hero.style.setProperty("--dur", `${DURATION / 1000}s`);

    const schedule = () => {
      clearTimeout(timer);
      if (reduce || hero.classList.contains("is-paused")) return;
      timer = setTimeout(() => show((current + 1) % slides.length), DURATION);
    };

    const show = (index) => {
      if (index !== current) hero.classList.remove("is-intro");
      current = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
        const copy = slide.querySelector(".slide-copy");
        if (copy) copy.inert = i !== index;
      });
      dots.forEach((dot, i) => {
        dot.classList.remove("is-active");
        dot.setAttribute("aria-current", String(i === index));
        if (i === index) {
          void dot.offsetWidth; // restart the progress line
          dot.classList.add("is-active");
        }
      });
      schedule();
    };

    dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));

    // wide layout: click the rolled-up scroll to open it. stacked layout: a tap flips to the other slide
    const stacked = window.matchMedia("(max-width: 1000px)");
    hero.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const slide = e.target.closest(".slide");
      const index = slides.indexOf(slide);
      if (!stacked.matches) {
        if (index > -1 && index !== current) show(index);
        return;
      }
      show((current + 1) % slides.length);
    });

    // reading time: pause while the pointer or focus is inside
    const pause = (on) => {
      hero.classList.toggle("is-paused", on);
      if (on) clearTimeout(timer);
      else show(current);
    };
    hero.addEventListener(
      "pointerenter",
      (e) => e.pointerType === "mouse" && pause(true),
    );
    hero.addEventListener(
      "pointerleave",
      (e) => e.pointerType === "mouse" && pause(false),
    );
    hero.addEventListener("focusin", () => pause(true));
    hero.addEventListener("focusout", () => pause(false));

    show(0);
    setTimeout(() => hero.classList.remove("is-intro"), 3200);

    /* drifting dust, kept faint */
    const canvas = hero.querySelector(".hero-dust canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      let w = 0;
      let h = 0;
      let dust = [];
      let raf = 0;
      let visible = true;

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        w = hero.clientWidth;
        h = hero.clientHeight;
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = w < 600 ? 50 : 100;
        dust = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          dx: (Math.random() - 0.5) * 0.7,
          dy: (Math.random() - 0.5) * 0.7,
          r: Math.random() * 1.1 + 1.4,
        }));
        draw(false);
      };

      const draw = (advance = true) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(210, 176, 106, 0.3)";
        for (const p of dust) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          if (!advance) continue;
          p.x += p.dx;
          p.y += p.dy;
          if (p.x > w || p.x < 0) p.dx *= -1;
          if (p.y > h || p.y < 0) p.dy *= -1;
        }
      };

      const loop = () => {
        draw();
        raf = visible ? requestAnimationFrame(loop) : 0;
      };

      resize();
      let resizeTimer = 0;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
      });
      if (!reduce) {
        new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !raf) loop();
        }).observe(hero);
        loop();
      }
    }
  }

  /* -------------------------------------------------------------- timeline */
  /* wide: the list runs down the page and the item at mid-height drives the image.
     phone: the list is a horizontal track and the item centred in it drives the image. */
  const items = [...document.querySelectorAll(".tl-item")];
  if (items.length) {
    const list = document.querySelector(".tl-list");
    const frames = [...document.querySelectorAll(".tl-frame img")];
    const marker = document.querySelector(".tl-track");
    const phone = window.matchMedia("(max-width: 820px)");
    const years = items.map((li) => Number(li.dataset.year));
    const first = years[0];
    const last = years[years.length - 1];
    let active = -1;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      const previous = frames.find((img) =>
        img.classList.contains("is-active"),
      );
      items.forEach((li, j) => li.classList.toggle("is-active", j === i));
      frames.forEach((img, j) => img.classList.toggle("is-active", j === i));
      if (previous && previous !== frames[i]) {
        frames.forEach((img) => img.classList.remove("is-prev"));
        previous.classList.add("is-prev");
        clearTimeout(setActive.t);
        setActive.t = setTimeout(
          () => previous.classList.remove("is-prev"),
          650,
        );
      }
      if (marker)
        marker.style.setProperty(
          "--pos",
          `${((years[i] - first) / (last - first)) * 100}%`,
        );
    };

    setActive(0);

    // wide layout
    const io = new IntersectionObserver(
      (entries) => {
        if (phone.matches) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(items.indexOf(entry.target));
        });
      },
      { rootMargin: "-44% 0px -44% 0px", threshold: 0 },
    );
    items.forEach((li) => {
      io.observe(li);
      li.addEventListener("pointerenter", (e) => {
        if (!phone.matches && e.pointerType === "mouse")
          setActive(items.indexOf(li));
      });
    });

    // phone layout: pick the event closest to the middle of the track
    const centred = () => {
      const box = list.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      let best = 0;
      let gap = Infinity;
      items.forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < gap) {
          gap = d;
          best = i;
        }
      });
      setActive(best);
    };
    let waiting = false;
    list.addEventListener(
      "scroll",
      () => {
        if (!phone.matches || waiting) return;
        waiting = true;
        requestAnimationFrame(() => {
          waiting = false;
          centred();
        });
      },
      { passive: true },
    );
    items.forEach((li) =>
      li.addEventListener("click", () => {
        if (!phone.matches) return;
        li.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          inline: "center",
          block: "nearest",
        });
      }),
    );
    // the track scrolls sideways, so it has to be reachable from the keyboard
    const syncTrack = () => {
      if (phone.matches) {
        list.setAttribute("tabindex", "0");
        centred();
      } else {
        list.removeAttribute("tabindex");
      }
    };
    phone.addEventListener("change", syncTrack);
    syncTrack();
  }

  /* ----------------------------------------------------------- throne depth */
  const throne = document.querySelector(".throne");
  const stage = document.querySelector(".throne-stage");
  if (
    throne &&
    stage &&
    !reduce &&
    window.matchMedia("(hover: hover)").matches
  ) {
    throne.addEventListener("pointermove", (e) => {
      const r = throne.getBoundingClientRect();
      stage.style.setProperty(
        "--px",
        ((e.clientX - r.left) / r.width - 0.5) * 2,
      );
      stage.style.setProperty(
        "--py",
        ((e.clientY - r.top) / r.height - 0.5) * 2,
      );
    });
    throne.addEventListener("pointerleave", () => {
      stage.style.setProperty("--px", 0);
      stage.style.setProperty("--py", 0);
    });
  }

  /* ---------------------------------------------------------------- music */
  const audio = document.getElementById("audio");
  const tracks = [...document.querySelectorAll(".track")];
  const music = document.querySelector(".music");
  const player = document.querySelector(".player");
  if (!audio || !tracks.length || !player) return;

  const nameEl = player.querySelector(".p-name");
  const timeEl = player.querySelector(".p-time");
  const fill = player.querySelector(".p-fill");
  const knob = player.querySelector(".p-knob");
  const seek = player.querySelector(".p-seek");
  const toggle = player.querySelector(".p-btn");
  const close = player.querySelector(".p-close");

  let dragging = false;
  let resumeAfterDrag = false;
  let current = null;

  const fmt = (t) => {
    if (!Number.isFinite(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };
  const setProgress = (percent) => {
    const p = Math.min(
      Math.max(Number.isFinite(percent) ? percent : 0, 0),
      100,
    );
    fill.style.width = `${p}%`;
    knob.style.left = `${p}%`;
    seek.setAttribute("aria-valuenow", String(Math.round(p)));
  };
  const setPlaying = (on) => {
    toggle.setAttribute("aria-pressed", String(on));
    music.classList.toggle("is-playing", on);
  };
  const percentFromPointer = (e) => {
    const r = seek.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  const seekTo = (percent) => {
    if (!Number.isFinite(audio.duration)) return;
    const p = Math.min(Math.max(percent, 0), 100);
    audio.currentTime = (p / 100) * audio.duration;
    setProgress(p);
    timeEl.textContent = fmt(audio.currentTime);
  };

  tracks.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (current === btn) {
        audio.paused ? audio.play().catch(() => {}) : audio.pause();
        return;
      }
      current = btn;
      tracks.forEach((t) => t.classList.toggle("is-current", t === btn));
      audio.pause();
      audio.src = `./music/${btn.dataset.id}.mp3`;
      audio.load();
      nameEl.textContent = btn.querySelector(".t").textContent.trim();
      setProgress(0);
      timeEl.textContent = "0:00";
      player.classList.add("is-open");
      document.body.classList.add("has-player");
      try {
        await audio.play();
      } catch (err) {
        console.error("Audio play error:", err);
        setPlaying(false);
      }
    });
  });

  audio.addEventListener("timeupdate", () => {
    if (dragging || !Number.isFinite(audio.duration)) return;
    setProgress((audio.currentTime / audio.duration) * 100);
    timeEl.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener(
    "loadedmetadata",
    () => (timeEl.textContent = fmt(audio.currentTime)),
  );
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => !dragging && setPlaying(false));
  audio.addEventListener("ended", () => {
    setPlaying(false);
    setProgress(100);
    timeEl.textContent = fmt(audio.duration);
  });

  toggle.addEventListener("click", () => {
    if (!audio.src) return;
    audio.paused ? audio.play().catch(() => setPlaying(false)) : audio.pause();
  });

  seek.addEventListener("pointerdown", (e) => {
    if (!Number.isFinite(audio.duration)) return;
    dragging = true;
    resumeAfterDrag = !audio.paused;
    e.preventDefault();
    try {
      seek.setPointerCapture(e.pointerId);
    } catch (_) {}
    seek.classList.add("is-seeking");
    audio.pause();
    seekTo(percentFromPointer(e));
  });
  seek.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    e.preventDefault();
    seekTo(percentFromPointer(e));
  });
  const endSeek = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      if (seek.hasPointerCapture(e.pointerId))
        seek.releasePointerCapture(e.pointerId);
    } catch (_) {}
    seek.classList.remove("is-seeking");
    if (resumeAfterDrag) audio.play().catch(() => setPlaying(false));
    else setPlaying(false);
  };
  seek.addEventListener("pointerup", endSeek);
  seek.addEventListener("pointercancel", endSeek);
  seek.addEventListener("keydown", (e) => {
    if (!Number.isFinite(audio.duration)) return;
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[
      e.key
    ];
    if (step) {
      e.preventDefault();
      audio.currentTime = Math.min(
        Math.max(audio.currentTime + step, 0),
        audio.duration,
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      audio.currentTime = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      audio.currentTime = audio.duration;
    }
  });

  close.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    dragging = false;
    setProgress(0);
    timeEl.textContent = "0:00";
    setPlaying(false);
    current = null;
    tracks.forEach((t) => t.classList.remove("is-current"));
    player.classList.remove("is-open");
    document.body.classList.remove("has-player");
  });
})();
