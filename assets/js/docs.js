/* Documentation language switch: Chinese or English. */
(function () {
  var KEY = "aureole.doclang";

  function detect() {
    var stored = "";
    try { stored = localStorage.getItem(KEY) || ""; } catch (e) {}
    if (stored === "zh" || stored === "en") return stored;
    var tag = (navigator.language || "en").toLowerCase();
    return tag.indexOf("zh") === 0 ? "zh" : "en";
  }

  function apply(lang) {
    var blocks = document.querySelectorAll("[data-doc-lang]");
    for (var i = 0; i < blocks.length; i++) {
      blocks[i].hidden = blocks[i].getAttribute("data-doc-lang") !== lang;
    }

    var buttons = document.querySelectorAll("[data-doc-btn]");
    for (var j = 0; j < buttons.length; j++) {
      var active = buttons[j].getAttribute("data-doc-btn") === lang;
      buttons[j].setAttribute("aria-pressed", active ? "true" : "false");
    }

    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh"
      ? "Aureole · 使用文档"
      : "Aureole · Documentation";

    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(detect());

    var buttons = document.querySelectorAll("[data-doc-btn]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        apply(this.getAttribute("data-doc-btn"));
      });
    }
  });
})();
