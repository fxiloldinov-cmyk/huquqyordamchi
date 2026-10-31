// Animatsiyalar: sarlavha soyasi, rasm parallaksi, aylantirganda paydo bo'lish.
// "Harakatni kamaytirish" yoqilgan bo'lsa, hech narsa harakatlanmaydi va hamma narsa darhol ko'rinadi.
(() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("motion-ready");

  // Sarlavha: sahifa aylantirilganda yengil soya
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  // Bosh rasm: sekin parallaks (kompyuterda)
  const photo = document.querySelector(".hero-photo img");
  if (photo && !RM && matchMedia("(min-width: 701px)").matches) {
    let ticking = false;
    const box = photo.parentElement;
    const update = () => {
      ticking = false;
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      box.style.setProperty("--py", `${Math.round(-r.top * 0.12)}px`);
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Aylantirganda paydo bo'lish: guruh ichida navbat bilan
  const GROUPS = [
    ".search-console", "#view-home .section-head", ".sit-groups", ".news-panel", ".documents-layout",
    ".code-card", ".student-banner", ".student-banner .analysis-steps>span", ".faq>div:first-child",
    ".faq details", ".footer-main>*", ".workspace-heading", ".tool-grid>*",
  ];
  const io = RM ? null : new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

  const mark = (root = document) => {
    for (const sel of GROUPS) {
      root.querySelectorAll(sel).forEach((el, k) => {
        if (el.hasAttribute("data-reveal")) return;
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--d", `${Math.min(k, 6) * 0.07}s`);
        if (RM) el.classList.add("in"); else io.observe(el);
      });
    }
  };
  mark();
  // Kodekslar kartochkalari keyinroq chiziladi — paydo bo'lganda belgilaymiz
  const codes = document.getElementById("codes");
  if (codes) new MutationObserver(() => mark(codes.parentElement)).observe(codes, { childList: true });
  // Bo'lim (view) almashganda ichidagi elementlarni ham kuzatamiz
  document.querySelectorAll(".view").forEach((v) => new MutationObserver(() => {
    if (v.classList.contains("active")) mark(v);
  }).observe(v, { attributes: true, attributeFilter: ["class"] }));
})();
