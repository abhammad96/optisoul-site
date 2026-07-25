(function () {
  var KEY = "optisoul-lang";

  function apply(lang) {
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-ar]").forEach(function (el) {
      el.hidden = lang !== "ar";
    });
    document.querySelectorAll("[data-en]").forEach(function (el) {
      el.hidden = lang !== "en";
    });

    var btn = document.getElementById("langBtn");
    if (btn) btn.textContent = lang === "ar" ? "English" : "العربية";

    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  function initial() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "ar" || saved === "en") return saved;
    } catch (e) {}
    return (navigator.language || "ar").toLowerCase().indexOf("ar") === 0
      ? "ar"
      : "en";
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(initial());
    var btn = document.getElementById("langBtn");
    if (btn) {
      btn.addEventListener("click", function () {
        apply(document.documentElement.lang === "ar" ? "en" : "ar");
      });
    }
  });
})();
