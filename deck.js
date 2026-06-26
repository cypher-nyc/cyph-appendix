/* ═══ cyph-appendix — minimal deck engine ═══
   Auto-discovers slides — no hardcoded total to keep in sync. A slide is any
   <section class="slide"> inside #deck-root. Optional data-chapter labels the
   running header. Nav: ← / → / space / PageUp / PageDown / Home / End, click
   left/right thirds, on-screen prev/next, and the counter. Boots only after
   gate.js injects the decrypted content and calls AppendixDeck.mount(). */

(function () {
  var slides = [];
  var cur = 0;
  var mounted = false;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function render() {
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.toggle("active", i === cur);
    }
    var ctr = document.getElementById("apx-ctr");
    if (ctr) ctr.textContent = pad(cur + 1) + " / " + pad(slides.length);
    var ch = document.getElementById("apx-chapter");
    if (ch) ch.textContent = slides[cur].getAttribute("data-chapter") || "";
    var fill = document.getElementById("apx-progress-fill");
    if (fill) {
      var pct = slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 100;
      fill.style.width = pct + "%";
    }
    if (location.hash !== "#" + (cur + 1)) {
      history.replaceState(null, "", "#" + (cur + 1));
    }
  }

  function go(n) {
    var next = Math.max(0, Math.min(slides.length - 1, n));
    if (next === cur) return;
    cur = next;
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
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(slides.length - 1);
        break;
    }
  }

  function wireChrome() {
    var p = document.getElementById("apx-prev");
    var n = document.getElementById("apx-next");
    if (p) p.addEventListener("click", prev);
    if (n) n.addEventListener("click", next);

    // click left/right thirds of the stage to page (ignores links/buttons)
    var stage = document.getElementById("deck-root");
    if (stage) {
      stage.addEventListener("click", function (e) {
        var t = e.target;
        if (t.closest("a, button, .no-page, pre, table")) return;
        var x = e.clientX / window.innerWidth;
        if (x < 0.33) prev();
        else if (x > 0.66) next();
      });
    }
  }

  function mount() {
    if (mounted) return;
    var root = document.getElementById("deck-root");
    slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    if (!slides.length) return;
    mounted = true;

    var fromHash = parseInt((location.hash || "").replace("#", ""), 10);
    cur = fromHash >= 1 && fromHash <= slides.length ? fromHash - 1 : 0;

    wireChrome();
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", function () {
      var h = parseInt((location.hash || "").replace("#", ""), 10);
      if (h >= 1 && h <= slides.length) go(h - 1);
    });
    render();
  }

  window.AppendixDeck = { mount: mount, go: go, next: next, prev: prev };
})();
