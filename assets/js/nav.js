(function () {
  "use strict";

  /* ---------- القائمة المنسدلة (hamburger) ---------- */
  function initNavToggle() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && window.matchMedia("(max-width: 640px)").matches) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  /* ---------- نمط WAI-ARIA Tabs ---------- */
  function initTabs() {
    var tablists = document.querySelectorAll('[role="tablist"]');
    tablists.forEach(function (tablist) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute("aria-controls"));
      });

      // الآن بعد تأكد عمل JS: نخفي كل الألواح غير النشطة (السقوط الآمن في
      // HTML الخام هو ظهورها كلها متتابعة بلا سمة hidden على الإطلاق).
      function activate(index, moveFocus) {
        tabs.forEach(function (tab, i) {
          var selected = i === index;
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          if (panels[i]) panels[i].hidden = !selected;
        });
        if (moveFocus) tabs[index].focus();
      }

      activate(0, false);

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { activate(i, false); });

        tab.addEventListener("keydown", function (e) {
          var rtl = document.documentElement.dir === "rtl";
          var last = tabs.length - 1;
          var next = null;

          if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1;
          else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = last;

          if (next === null) return;
          e.preventDefault();
          if (next < 0) next = last;
          if (next > last) next = 0;
          activate(next, true);
        });
      });
    });
  }

  /* ---------- ظهور تدريجي عند التمرير ---------- */
  function initReveal() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var targets = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initTabs();
    initReveal();
  });
})();
