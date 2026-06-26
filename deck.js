/* ═══ cyph-appendix — drilldown engine ═══
   cyph-deck navigation feel (paprika HUD tabs + prev/next + counter) over
   WHITEPAPER documents. A drilldown is <section class="drilldown"> in
   #deck-root; only the active one shows and it flows to its natural height,
   so the scroll container reads it like a document. Auto-discovered — no
   hardcoded total to keep in sync.

   Nav: ← / → (and PageUp+Home / PageDown+End via buttons) switch drilldowns;
   ↑/↓, space, and the wheel SCROLL the current whitepaper (native). Tabs in
   the top HUD jump directly. Boots after gate.js injects decrypted content
   and calls AppendixDeck.mount(). */

(function () {
  var dd = [];
  var cur = 0;
  var mounted = false;
  var root, tabsEl, counterEl, titleEl, fillEl;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }
  function label(i) {
    return dd[i].getAttribute("data-chapter") || "drilldown " + (i + 1);
  }

  function buildTabs() {
    tabsEl.innerHTML = "";
    for (var i = 0; i < dd.length; i++) {
      if (i > 0) {
        var sep = document.createElement("span");
        sep.className = "apx-tab-sep";
        sep.textContent = "·";
        tabsEl.appendChild(sep);
      }
      var b = document.createElement("button");
      b.className = "apx-tab";
      b.textContent = label(i);
      b.setAttribute("data-i", i);
      b.addEventListener("click", function () {
        go(parseInt(this.getAttribute("data-i"), 10));
      });
      tabsEl.appendChild(b);
    }
  }

  function render() {
    for (var i = 0; i < dd.length; i++) {
      dd[i].classList.toggle("active", i === cur);
    }
    var tabs = tabsEl.querySelectorAll(".apx-tab");
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.toggle("active", j === cur);
    }
    if (counterEl) counterEl.textContent = pad(cur + 1) + " / " + pad(dd.length);
    if (titleEl) titleEl.textContent = label(cur);
    if (fillEl) {
      var pct = dd.length > 1 ? (cur / (dd.length - 1)) * 100 : 100;
      fillEl.style.width = pct + "%";
    }
    // keep the active tab in view within the scrollable HUD tab strip
    var act = tabsEl.querySelector(".apx-tab.active");
    if (act && act.scrollIntoView)
      act.scrollIntoView({ inline: "center", block: "nearest" });
    if (location.hash !== "#" + (cur + 1)) {
      history.replaceState(null, "", "#" + (cur + 1));
    }
  }

  function go(n) {
    var next = Math.max(0, Math.min(dd.length - 1, n));
    cur = next;
    if (root) root.scrollTop = 0; // each drilldown opens at its top
    render();
  }
  function next() {
    go(cur + 1);
  }
  function prev() {
    go(cur - 1);
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    // arrows switch drilldowns; everything else (↑↓, space, PgUp/Dn) scrolls.
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  }

  function wireChrome() {
    var p = document.getElementById("apx-prev");
    var n = document.getElementById("apx-next");
    if (p) p.addEventListener("click", prev);
    if (n) n.addEventListener("click", next);
  }

  function mount() {
    if (mounted) return;
    root = document.getElementById("deck-root");
    dd = Array.prototype.slice.call(root.querySelectorAll(".drilldown"));
    if (!dd.length) return;
    mounted = true;

    tabsEl = document.getElementById("apx-tabs");
    counterEl = document.getElementById("apx-counter");
    titleEl = document.getElementById("apx-title");
    fillEl = document.getElementById("apx-progress-fill");

    var fromHash = parseInt((location.hash || "").replace("#", ""), 10);
    cur = fromHash >= 1 && fromHash <= dd.length ? fromHash - 1 : 0;

    buildTabs();
    wireChrome();
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", function () {
      var h = parseInt((location.hash || "").replace("#", ""), 10);
      if (h >= 1 && h <= dd.length && h - 1 !== cur) go(h - 1);
    });
    render();
  }

  window.AppendixDeck = { mount: mount, go: go, next: next, prev: prev };
})();
