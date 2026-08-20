(function () {
  "use strict";

  /* ---------- القائمة المنسدلة (hamburger) ----------
     الآلية الأساسية details/summary أصيلة في HTML — تعمل بلا هذا الكود
     تمامًا (سمة open حقيقية، تعمل بالنقر وEnter/Space على summary، ومحتوى
     details المغلق يُستبعد تلقائيًا من ترتيب Tab بواسطة المتصفح نفسه).
     كل ما هنا تحسين تقدّمي فوق ذلك: إغلاق افتراضي أنيق على الجوال بدل
     الفتح الدائم، مزامنة aria-expanded كطبقة دفاع إضافية، وEsc/النقر خارج
     القائمة — كلاهما لا يمكن تحقيقه بـCSS خالص (لا محدِّد CSS لضغطة مفتاح
     أو "خارج عنصر"). */
  function initNavToggle() {
    var details = document.getElementById("navDisclosure");
    var summary = document.getElementById("navToggle");
    var nav = document.getElementById("siteNav");
    if (!details || !summary || !nav) return;

    var isMobile = function () { return window.matchMedia("(max-width: 640px)").matches; };
    var desktopQuery = window.matchMedia("(min-width: 641px)");

    // إغلاق افتراضي أنيق على الجوال فقط — تحسين، لا شرط. بلا JS تبقى
    // القائمة مفتوحة (سمة open الثابتة في HTML)، وهذا سلوك سليم تمامًا.
    if (isMobile()) details.open = false;

    // عند الانتقال لعرض سطح المكتب (تدوير جهاز، سحب نافذة) تُفرض open=true
    // دائمًا — summary مخفي بصريًا هناك أصلًا، فلا فرق ظاهري، لكن هذا يمنع
    // بقاء details في حالة "مغلقة" فعليًا أثناء display:contents، وهو سلوك
    // غير موثَّق بثبات عبر المحرّكات لعنصر details تحديدًا.
    var syncOpenForViewport = function (e) {
      if (e.matches) details.open = true;
    };
    if (desktopQuery.matches) details.open = true;
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", syncOpenForViewport);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(syncOpenForViewport); // دعم متصفحات أقدم
    }

    var syncAria = function () {
      summary.setAttribute("aria-expanded", String(details.open));
    };
    syncAria();

    details.addEventListener("toggle", syncAria);

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && isMobile()) details.open = false;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && details.open && isMobile()) {
        details.open = false;
        summary.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (isMobile() && details.open && !details.contains(e.target)) {
        details.open = false;
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
