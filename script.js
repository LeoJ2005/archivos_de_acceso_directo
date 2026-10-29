/* ============================================================
   ARCHIVO / DIRECTO — navegación entre fichas
   ============================================================ */

(() => {
  "use strict";

  const deck = document.getElementById("deck");
  const slides = Array.from(deck.querySelectorAll(".slide"));
  const rail = document.getElementById("rail");
  const counterNow = document.getElementById("counterNow");
  const counterTotal = document.getElementById("counterTotal");
  const progressFill = document.getElementById("progressFill");
  const chapterLabel = document.getElementById("chapterLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const liveStatus = document.getElementById("liveStatus");

  const total = slides.length;
  const pad = (n) => String(n).padStart(2, "0");
  let index = 0;
  let initialized = false;

  counterTotal.textContent = pad(total);

  /* ---------- Índice lateral generado desde las fichas ---------- */

  slides.forEach((slide, i) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "rail__item";
    item.dataset.go = String(i);
    item.setAttribute("aria-label", `Ir a la ficha: ${slide.dataset.name}`);

    const label = document.createElement("span");
    label.className = "rail__label";
    label.textContent = slide.dataset.name;

    const tick = document.createElement("span");
    tick.className = "rail__tick";

    item.append(label, tick);
    rail.appendChild(item);
  });

  const railItems = Array.from(rail.querySelectorAll(".rail__item"));

  /* ---------- Pintar una ficha ---------- */

  function render(next, direction = "next") {
    const changed = next !== index;
    if (!changed && initialized) return;

    deck.dataset.dir = direction;
    index = next;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });

    const activeSlide = slides[index];
    const accent = activeSlide.dataset.accent || "#d64524";

    document.body.dataset.theme = activeSlide.dataset.theme || "light";
    document.body.style.setProperty("--accent", accent);

    counterNow.textContent = pad(index + 1);
    progressFill.style.transform = `scaleX(${(index + 1) / total})`;
    chapterLabel.textContent = activeSlide.dataset.name;

    railItems.forEach((item, i) => {
      const active = i === index;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    if (changed && initialized) {
      if (document.activeElement === nextBtn && nextBtn.disabled) prevBtn.focus();
      if (document.activeElement === prevBtn && prevBtn.disabled) nextBtn.focus();

      if (counterNow.animate) {
        counterNow.animate(
          [
            { transform: "translateY(50%)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 }
          ],
          { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" }
        );
      }
    }

    const scroller = activeSlide.querySelector(".slide__scroll");
    if (scroller && changed) scroller.scrollTop = 0;

    liveStatus.textContent = `Ficha ${index + 1} de ${total}: ${activeSlide.dataset.name}`;

    try {
      history.replaceState(null, "", `#ficha-${index + 1}`);
    } catch (error) {
      /* file:// puede bloquear replaceState en algunos navegadores */
    }
  }

  function goTo(target) {
    const next = Math.max(0, Math.min(total - 1, Number(target)));
    if (Number.isNaN(next) || next === index) return;
    render(next, next > index ? "next" : "prev");
  }

  /* ---------- Controles ---------- */

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger) return;
    event.preventDefault();
    goTo(trigger.dataset.go);
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const tag = (event.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    const forward = ["ArrowRight", "ArrowDown", "PageDown"];
    const backward = ["ArrowLeft", "ArrowUp", "PageUp"];

    if (forward.includes(event.key)) {
      event.preventDefault();
      goTo(index + 1);
    } else if (backward.includes(event.key)) {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(total - 1);
    }
  });

  /* ---------- Deslizar en pantallas táctiles ---------- */

  let touchStart = null;

  deck.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });

  deck.addEventListener("pointerup", (event) => {
    if (!touchStart || event.pointerId !== touchStart.id) return;

    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(index + (dx < 0 ? 1 : -1));
    }
  });

  deck.addEventListener("pointercancel", () => {
    touchStart = null;
  });

  /* ---------- Parallax suave de la ficha de portada ---------- */

  const hero = document.querySelector(".slide--hero");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (hero && finePointer && !reducedMotion) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--mx", `${(x * 12).toFixed(1)}px`);
      hero.style.setProperty("--my", `${(y * 9).toFixed(1)}px`);
    });

    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--mx", "0px");
      hero.style.setProperty("--my", "0px");
    });
  }

  /* ---------- Enlace directo a una ficha ---------- */

  const match = window.location.hash.match(/ficha-(\d+)/);
  const requested = match ? Number(match[1]) - 1 : 0;
  const initial = Math.max(0, Math.min(total - 1, Number.isFinite(requested) ? requested : 0));

  render(initial);
  initialized = true;

  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.match(/ficha-(\d+)/);
    if (!hash) return;
    goTo(Number(hash[1]) - 1);
  });
})();
