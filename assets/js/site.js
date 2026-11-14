/* Aureole homepage behaviour: language switching, links, comments. */
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
    var version = CFG.version || "1.1.0";
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

  var GISCUS_LANG = {
    zh_CN: "zh-CN", zh_TW: "zh-TW", pt_BR: "pt", nb_NO: "nb"
  };

  function mountComments() {
    var host = document.getElementById("comments");
    if (!host || !CFG.giscus) return;
    var g = CFG.giscus;
    var configured = g.repoId && g.repoId.indexOf("REPLACE") !== 0 &&
                     g.categoryId && g.categoryId.indexOf("REPLACE") !== 0 &&
                     g.repo && g.repo.indexOf("YOUR_GITHUB_NAME") !== 0;

    host.innerHTML = "";
    if (!configured) {
      var note = document.createElement("p");
      note.className = "comments-note";
      note.setAttribute("data-i18n", "cm.pending");
      note.textContent = t(currentLang(), "cm.pending");
      host.appendChild(note);
      return;
    }

    loadGiscus(host, g, 0);
  }

  // giscus.app is occasionally unreachable from mainland networks. Retry twice,
  // then leave a direct link so the thread can still be read and answered.
  function loadGiscus(host, g, attempt) {
    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    var code = currentLang();
    var lang = GISCUS_LANG[code] || code.split("_")[0].toLowerCase();
    script.setAttribute("data-repo", g.repo);
    script.setAttribute("data-repo-id", g.repoId);
    script.setAttribute("data-category", g.category || "Announcements");
    script.setAttribute("data-category-id", g.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "transparent_dark");
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-loading", "lazy");
    host.appendChild(script);

    setTimeout(function () {
      if (host.querySelector("iframe")) return;
      var old = host.querySelector('script[src^="https://giscus.app/client.js"]');
      if (old) old.parentNode.removeChild(old);
      if (attempt < 2) {
        loadGiscus(host, g, attempt + 1);
        return;
      }
      host.innerHTML = "";
      var note = document.createElement("p");
      note.className = "comments-note";
      var link = document.createElement("a");
      link.href = "https://github.com/" + (CFG.owner || "") + "/" +
                  (CFG.repo || "aureole") + "/discussions";
      link.textContent = "GitHub Discussions ↗";
      note.appendChild(link);
      host.appendChild(note);
    }, 6000);
  }

  var active = FALLBACK;

  function currentLang() {
    return active;
  }

  function setLang(code, mount) {
    active = (findLang(code) || findLang(FALLBACK)).code;
    apply(active);
    if (mount) mountComments();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var select = document.getElementById("lang-select");
    if (select) buildSelect(select);

    setLang(detect(), false);
    applyLinks();
    mountComments();

    if (select) {
      select.addEventListener("change", function () {
        setLang(select.value, true);
      });
    }
  });
})();
