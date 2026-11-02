/* Usage-agreement gate. The app stays hidden and does not start until the box is checked and Continue is
   pressed. Agreement is deliberately not stored anywhere, so it is asked again on every visit. */
(function () {
  "use strict";
  var T = window.CIVICS_TERMS;
  var appEl = document.getElementById("app");
  var openedFrom = null;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function termsHtml() {
    var h = '<div class="tsum"><div class="label">The short version</div><ul>' +
      T.summary.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
    T.sections.forEach(function (sec) {
      h += "<h3>" + esc(sec.h) + "</h3>";
      sec.p.forEach(function (p) {
        if (typeof p === "string") h += "<p>" + esc(p) + "</p>";
        else h += "<ul>" + p.ul.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>";
      });
    });
    return h + "<p><b>" + esc(T.closing) + "</b></p>";
  }

  function download() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([window.civicsTermsText()], { type: "text/plain;charset=utf-8" }));
    a.download = "Civics128-Terms-of-Use-v" + T.version + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* mode "gate": must agree to continue. mode "view": read-only, opened from the footer. */
  function open(mode) {
    var gate = mode === "gate";
    var ov = document.createElement("div");
    ov.className = "gate"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "gate-title");
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="label">Please read before using</div>' +
        '<h1 id="gate-title">' + esc(T.title) + "</h1>" +
        '<p class="status">Version ' + esc(T.version) + " · Effective " + esc(T.effective) + "</p>" +
        '<div class="gate-scroll" tabindex="0" aria-label="Full text of the terms">' + termsHtml() + "</div>" +
        (gate ? '<label class="gate-check"><input type="checkbox" id="gate-ok"> <span>I have read and agree to the Terms of Use and Disclaimer.</span></label>' +
                  '<label class="gate-check gate-shared"><input type="checkbox" id="gate-shared"> <span>This is a public or shared computer. Do not save or keep my quiz results here. <em>(Optional. Nothing is read from or written to this browser or computer, and results disappear when you close or reload the page.)</em></span></label>' : "") +
        '<div class="row">' +
          (gate ? '<button class="btn primary" id="gate-go" type="button" disabled>Continue</button>' +
                  '<button class="btn quiet" id="gate-no" type="button">I do not agree</button>'
                : '<button class="btn primary" id="gate-close" type="button">Close</button>') +
          '<button class="btn" id="gate-dl" type="button">Download agreement</button>' +
        "</div>" +
        '<p class="status" id="gate-msg" role="status"></p>' +
      "</div>";
    document.body.appendChild(ov);
    openedFrom = document.activeElement;
    if (gate) { appEl.classList.add("hidden"); }
    var $ = function (id) { return ov.querySelector("#" + id); };
    $("gate-dl").addEventListener("click", download);
    if (gate) {
      var ok = $("gate-ok"), go = $("gate-go");
      ok.addEventListener("change", function () { go.disabled = !ok.checked; });
      go.addEventListener("click", function () {
        if (!ok.checked) return;
        var shared = !!(ov.querySelector("#gate-shared") && ov.querySelector("#gate-shared").checked);
        ov.remove(); appEl.classList.remove("hidden");
        document.dispatchEvent(new CustomEvent("civics:agreed", { detail: { shared: shared } }));
      });
      $("gate-no").addEventListener("click", function () {
        ok.checked = false; go.disabled = true;
        $("gate-msg").textContent = "You need to agree to use this app. Close this tab, or reload the page to review the terms again.";
      });
      ok.focus();
    } else {
      $("gate-close").addEventListener("click", function () { ov.remove(); if (openedFrom && openedFrom.focus) openedFrom.focus(); });
      ov.addEventListener("keydown", function (e) { if (e.key === "Escape") { ov.remove(); if (openedFrom && openedFrom.focus) openedFrom.focus(); } });
      $("gate-close").focus();
    }
  }

  var view = document.getElementById("terms-view"), dl = document.getElementById("terms-dl");
  if (view) view.addEventListener("click", function () { open("view"); });
  if (dl) dl.addEventListener("click", download);
  open("gate");
})();
