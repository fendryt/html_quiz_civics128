/* Terms of Use and Disclaimer: the single source for the on-screen agreement, the downloadable copy
   (the "Download agreement" button) and TERMS.md (run `node tools/build-terms.js` after editing).
   Bump `version` and `effective` whenever the text changes.
   AUTHOR is how the agreement refers to you. Put your name or handle there if you want it named. */
window.CIVICS_TERMS = (function () {
  var AUTHOR = "the author";
  return {
    title: "Civics 128 Terms of Use and Disclaimer",
    version: "1.1",
    effective: "November 2, 2026",
    author: AUTHOR,
    summary: [
      "Civics 128 is a free, unofficial study aid. It is not affiliated with USCIS, DHS or any government agency, and it is not legal advice.",
      "It is provided “as is”, with no warranty. You use it at your own risk, and " + AUTHOR + " is not liable for any loss or outcome.",
      AUTHOR.charAt(0).toUpperCase() + AUTHOR.slice(1) + " collects no personal information. Your progress stays on your own device. The page’s host, GitHub Pages, may log technical data under GitHub’s own privacy statement.",
      "You decide which folder to save to and which files to load or share. You are responsible for keeping private or confidential information out of them."
    ],
    sections: [
      { h: "1. Agreement", p: [
        "By checking the box and selecting Continue you agree to these terms. If you do not agree, do not use the app. You must agree each time you open the page. The app does not remember your agreement.",
        "You must be 18 or older, or have a parent or guardian’s permission, to use the app."
      ] },
      { h: "2. What this app is, and is not", p: [
        "Civics 128 is an unofficial self-study tool for practicing the publicly published 2025 naturalization civics test questions (USCIS Form M-1778). It is not affiliated with, endorsed by or sponsored by U.S. Citizenship and Immigration Services, the Department of Homeland Security or any other government body. Those names are used only to identify the public test.",
        "The questions and answers may contain errors or become out of date. Some answers depend on who holds office or where you live. Always check the official sources, including uscis.gov/citizenship/testupdates, before your interview.",
        "Nothing in the app is legal, immigration or professional advice, and using it creates no attorney-client or other professional relationship. Using the app does not guarantee that you will pass the test, that an application will be approved, or any other outcome."
      ] },
      { h: "3. No warranty", p: [
        "THE APP AND ITS CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE”, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. THIS INCLUDES ANY WARRANTY OF ACCURACY, COMPLETENESS, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, UNINTERRUPTED OR ERROR-FREE OPERATION, OR FREEDOM FROM HARMFUL COMPONENTS.",
        "Saved progress can be lost, corrupted or overwritten (for example by a browser setting, a full disk or a file open in another program). Keep your own backup if it matters to you."
      ] },
      { h: "4. Limitation of liability", p: [
        "TO THE FULLEST EXTENT PERMITTED BY LAW, " + AUTHOR.toUpperCase() + " AND ANY CONTRIBUTORS ARE NOT LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, OR FOR ANY LOSS, ARISING FROM OR RELATED TO YOUR USE OF, OR INABILITY TO USE, THE APP. THIS INCLUDES LOSS OF DATA, TEST RESULTS, IMMIGRATION OR APPLICATION OUTCOMES, FEES, TIME OR REPUTATION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH LOSS.",
        "If a court decides that some liability cannot be excluded, it is limited to the amount you paid to use the app, which is zero."
      ] },
      { h: "5. Privacy: what the author collects", p: [
        "Nothing. The app has no accounts, sets no cookies, runs no analytics or advertising, and sends none of your data to " + AUTHOR + " or anyone else. It loads no third-party scripts or fonts, and the page tells your browser to block outgoing network connections for your data.",
        "The page is hosted by GitHub Pages. As the host, GitHub may collect technical information such as your IP address, browser type and request times, under GitHub’s own privacy statement. " + AUTHOR.charAt(0).toUpperCase() + AUTHOR.slice(1) + " does not receive that information from the app and does not control GitHub’s practices.",
        "The app does not ask you to type any personal information. Do not put personal information into any file you save with it."
      ] },
      { h: "6. Where your data lives", p: [
        "Your progress (which questions were asked, your marks, the times, and your questions-per-day setting) is kept only on your device: in your browser’s storage for this site and, if you choose, in plain-text JSON and CSV files in a folder you pick. It is never uploaded.",
        "Those files are not encrypted. Anyone with access to your computer, your browser profile or that folder can read them. That includes cloud-sync services if the folder is synced, and public repositories if you publish the files.",
        "On a public or shared computer, tick the shared-computer box on the agreement screen. The app then reads nothing from and writes nothing to the browser’s storage or any folder, and your results exist only in memory until you close or reload the page. Files you choose to download are saved to that computer’s normal download location, and you are responsible for deleting them. The app cannot guarantee that a shared computer is free of other software that records what you do."
      ] },
      { h: "7. Folder permission and security", p: [
        "Saving to a folder uses your browser’s own folder picker. The permission is limited to:",
        { ul: [
          "the one folder you choose, and only in this browser. Other websites, other browsers and other people on your computer do not get it;",
          "this page’s address. Your browser may ask you to reconnect the folder from time to time, and you can revoke the permission at any time in your browser’s site settings;",
          "four named files: civics128-progress.json, civics128-daily.csv, civics128-questions.csv and civics128-attempts.csv. The app reads only civics128-progress.json from that folder and never deletes anything."
        ] },
        "The app cannot browse your other folders, cannot see other files, and cannot choose a folder without your action. These limits are enforced by your browser, not by the author’s promise alone."
      ] },
      { h: "8. Your responsibility for data", p: [
        "You alone decide what to load, save, import, export, download, share, commit or upload. Do not load or save files that contain private, confidential, sensitive, personal or harmful content. Only use Load backup with files you created with this app and trust.",
        AUTHOR.charAt(0).toUpperCase() + AUTHOR.slice(1) + " is not responsible for any exposure, disclosure, loss or misuse of information that results from files you choose to create, load, store, share or upload. That includes publishing them in a public repository, storing them in a synced or shared folder, or using them with other software or services such as your browser, operating system, cloud storage or GitHub."
      ] },
      { h: "9. Acceptable use", p: [
        "Do not use the app to break the law, to probe, attack or disrupt the page or its host, or to present it as an official government product. If you copy or fork the app, you are responsible for your own version, and you must not remove this disclaimer or imply that " + AUTHOR + " endorses it."
      ] },
      { h: "10. Ownership and permission to use", p: [
        "The test questions and answers are published by USCIS. Apart from that content, the app’s code and design belong to " + AUTHOR + ". You may use the app for personal, non-commercial study. This permission is limited, revocable and not transferable. All other rights are reserved."
      ] },
      { h: "11. Changes and availability", p: [
        "The app may change, be suspended or be removed at any time without notice. These terms may be updated. The version and date are shown above, and the current version applies each time you open the page."
      ] },
      { h: "12. Indemnity", p: [
        "To the extent permitted by law, you agree to defend, indemnify and hold harmless " + AUTHOR + " from any claim, loss or expense (including reasonable legal fees) arising from your use of the app, the data you create, load, store or share with it, or your breach of these terms."
      ] },
      { h: "13. General", p: [
        "These terms are governed by the laws of the State of California, USA, without regard to conflict-of-law rules. If any part is found unenforceable, the rest stays in effect. Not enforcing a term is not a waiver of it. These terms are the entire agreement about use of the app. Rights that the law does not allow to be waived are not affected."
      ] }
    ],
    closing: "By checking the box you confirm that you have read, understood and agree to these terms."
  };
})();

/* Plain-text copy of the agreement (used by the download button and by tools/build-terms.js). */
window.civicsTermsText = function () {
  var T = window.CIVICS_TERMS, out = [];
  out.push(T.title.toUpperCase(), "Version " + T.version + " · Effective " + T.effective, "", "THE SHORT VERSION");
  T.summary.forEach(function (s) { out.push("- " + s); });
  T.sections.forEach(function (sec) {
    out.push("", sec.h);
    sec.p.forEach(function (p) {
      if (typeof p === "string") out.push(p, "");
      else { p.ul.forEach(function (li) { out.push("  - " + li); }); out.push(""); }
    });
  });
  out.push(T.closing, "");
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
};
