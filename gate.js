/* ═══ cyph-appendix — access gate (real encryption) ═══
   Unlike the deck's soft email gate, this is genuine protection: the slide
   content ships only as AES-256-GCM ciphertext (payload.enc.json). The
   password you type derives the decryption key in-browser via Web Crypto;
   a wrong password fails the GCM auth tag and nothing is revealed. Even
   though every file on the public host is downloadable, the content is not
   readable without the password.

   Localhost bypass: when running locally the plaintext content/slides.html
   exists, so we load it directly — no password, no rebuild — for fast
   authoring. On the deployed host content/ is absent, so the password gate
   is the only way in. */

(function () {
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

  var KDF = { iter: 250000, hash: "SHA-256" }; // mirrors build/encrypt.mjs

  function bytesFromB64(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveKey(password, salt) {
    var baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: KDF.iter, hash: KDF.hash },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptPayload(payload, password) {
    var salt = bytesFromB64(payload.salt);
    var iv = bytesFromB64(payload.iv);
    var ct = bytesFromB64(payload.ct);
    var key = await deriveKey(password, salt);
    var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  }

  function mount(html) {
    var root = document.getElementById("deck-root");
    root.innerHTML = html;
    document.body.classList.add("authed");
    var gate = document.getElementById("auth-gate");
    if (gate) gate.remove();
    if (window.AppendixDeck && window.AppendixDeck.mount) {
      window.AppendixDeck.mount();
    }
  }

  async function loadEncrypted() {
    var res = await fetch("payload.enc.json", { cache: "no-store" });
    if (!res.ok) throw new Error("payload not found");
    return res.json();
  }

  async function loadPlaintext() {
    var res = await fetch("content/slides.html", { cache: "no-store" });
    if (!res.ok) throw new Error("plaintext not found");
    return res.text();
  }

  function showError(msg) {
    var err = document.getElementById("auth-err");
    if (err) err.textContent = msg;
  }

  function setBusy(busy) {
    var btn = document.querySelector("#auth-form button");
    var input = document.getElementById("auth-input");
    if (btn) btn.disabled = busy;
    if (input) input.disabled = busy;
    if (btn) btn.textContent = busy ? "decrypting…" : "enter";
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Local authoring: load plaintext directly, skip the gate entirely.
    if (isLocal) {
      loadPlaintext()
        .then(mount)
        .catch(function () {
          showError("no local content/slides.html: create it to author.");
        });
      return;
    }

    var form = document.getElementById("auth-form");
    var input = document.getElementById("auth-input");
    if (input) input.focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var password = (input.value || "").trim();
      if (!password) {
        showError("enter the password");
        return;
      }
      showError(" ");
      setBusy(true);
      loadEncrypted()
        .then(function (payload) {
          return decryptPayload(payload, password);
        })
        .then(function (html) {
          mount(html);
        })
        .catch(function (err) {
          setBusy(false);
          // GCM failure (wrong password) and fetch failure both land here.
          showError(
            String(err && err.message).indexOf("payload") !== -1
              ? "content unavailable: payload.enc.json missing"
              : "wrong password"
          );
          input.focus();
          input.select();
        });
    });
  });
})();
