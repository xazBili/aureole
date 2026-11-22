/* Aureole homepage behaviour: language switching and links. */
(function () {
  var CFG = window.AUREOLE || {};
  var I18N = window.AUREOLE_I18N || {};
  var LANGS = window.AUREOLE_LANGS || [{ code: "en", native: "English", rtl: false }];
  var FALLBACK = "en";

  function normalizeTag(tag) {
    if (!tag) return "";
    var low = tag.toLowerCase().replace(/_/g, "-");
    if (low === "zh-tw" || low === "zh-hk" || low === "zh-hant" || low.indexOf("zh-hant") === 0) return "zh_TW";
    if (low.indexOf("zh") === 0) return "zh_CN";
    if (low === "pt-br" || low.indexOf("pt-br") === 0) return "pt_BR";
    if (low === "nb" || low === "no" || low === "nb-no") return "nb_NO";
    return "";
  }

  function detect() {
    var stored = "";
    try { stored = localStorage.getItem("aureole.lang") || ""; } catch (e) {}
    if (stored && findLang(stored)) return stored;

    var tags = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || "en"];

    for (var i = 0; i < tags.length; i++) {
      var mapped = normalizeTag(tags[i]);
      if (mapped) return mapped;
      var base = String(tags[i]).toLowerCase().split("-")[0];
      for (var j = 0; j < LANGS.length; j++) {
        if (LANGS[j].code.toLowerCase().split("_")[0] === base) return LANGS[j].code;
      }
    }
    return FALLBACK;
  }

  function findLang(code) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code.toLowerCase() === String(code).toLowerCase()) return LANGS[i];
    }
    return null;
  }

  function t(lang, key) {
    var dict = I18N[lang];
    if (dict && dict[key]) return dict[key];
    if (I18N[FALLBACK] && I18N[FALLBACK][key]) return I18N[FALLBACK][key];
    return "";
  }

  function buildSelect(select) {
    select.innerHTML = "";
    LANGS.forEach(function (lang) {
      var option = document.createElement("option");
      option.value = lang.code;
      option.textContent = lang.native;
      select.appendChild(option);
    });
  }

  function apply(lang) {
    var info = findLang(lang) || findLang(FALLBACK);
    var code = info.code;
    var dict = I18N[code] || {};

    document.documentElement.lang = code.replace("_", "-");
    document.documentElement.dir = info.rtl ? "rtl" : "ltr";

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      var value = dict[key] || t(FALLBACK, key);
      if (value) nodes[i].textContent = value;
    }

    var title = document.querySelector("[data-i18n-title]");
    if (title) {
      document.title = title.getAttribute("data-i18n-title") + " · Aureole";
    } else {
      document.title = "Aureole · " + t(code, "hero.title");
    }

    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t(code, "hero.sub"));

    var select = document.getElementById("lang-select");
    if (select) select.value = code;

    try { localStorage.setItem("aureole.lang", code); } catch (e) {}
  }

  function applyLinks() {
    var version = CFG.version || "2.0.0";
    var owner = CFG.owner || "YOUR_GITHUB_NAME";
    var repo = CFG.repo || "aureole";
    var base = "https://github.com/" + owner + "/" + repo;

    var map = {
      download: CFG.downloadFile || "downloads/AureoleSetup-" + version + ".exe",
      releases: base + "/releases",
      repo: base,
      issues: base + "/issues",
      docs: "docs.html"
    };

    var links = document.querySelectorAll("[data-link]");
    for (var i = 0; i < links.length; i++) {
      var name = links[i].getAttribute("data-link");
      if (map[name]) links[i].setAttribute("href", map[name]);
      if (name === "download") links[i].setAttribute("download", "");
    }

    var year = document.getElementById("year");
    if (year) year.textContent = "2026";
  }

  var active = FALLBACK;

  function setLang(code) {
    active = (findLang(code) || findLang(FALLBACK)).code;
    apply(active);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var select = document.getElementById("lang-select");
    if (select) buildSelect(select);

    setLang(detect());
    applyLinks();

    if (select) {
      select.addEventListener("change", function () {
        setLang(select.value);
      });
    }
  });
})();
