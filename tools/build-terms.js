/* Regenerates TERMS.md from terms.js.  Usage: node tools/build-terms.js */
const fs = require("fs"), path = require("path");
global.window = {};
require(path.join(__dirname, "..", "terms.js"));
const T = window.CIVICS_TERMS;
const md = [`# ${T.title}`, `Version ${T.version} · Effective ${T.effective}`, "", "## The short version", ""];
T.summary.forEach(s => md.push(`- ${s}`));
T.sections.forEach(sec => {
  md.push("", `## ${sec.h}`, "");
  sec.p.forEach(p => { if (typeof p === "string") md.push(p, ""); else { p.ul.forEach(li => md.push(`- ${li}`)); md.push(""); } });
});
md.push(`**${T.closing}**`, "");
fs.writeFileSync(path.join(__dirname, "..", "TERMS.md"), md.join("\n").replace(/\n{3,}/g, "\n\n"));
console.log("TERMS.md written");
