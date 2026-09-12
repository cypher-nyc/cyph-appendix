/* Extracts four drilldowns from content/slides.html and emits a print-ready
   standalone HTML that reuses styles.css verbatim + a print override sheet. */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "/Users/cash/Documents/github/cyph/cyph-appendix";
const OUT = process.argv[2];

const WANT = [
  "video infrastructure",
  "cyph orbits",
  "topic pipeline",
  "platform architecture",
];

const src = await readFile(join(ROOT, "content", "slides.html"), "utf8");
const css = await readFile(join(ROOT, "styles.css"), "utf8");

// split on top-level <section class="drilldown" ...> ... </section>
const parts = [];
const re = /<section class="drilldown" data-chapter="([^"]+)">/g;
let m;
const starts = [];
while ((m = re.exec(src))) starts.push({ chapter: m[1], idx: m.index });
for (let i = 0; i < starts.length; i++) {
  const end = i + 1 < starts.length ? starts[i + 1].idx : src.length;
  const chunk = src.slice(starts[i].idx, end);
  const close = chunk.lastIndexOf("</section>");
  parts.push({ chapter: starts[i].chapter, html: chunk.slice(0, close + 10) });
}

const picked = WANT.map((w) => {
  const p = parts.find((x) => x.chapter === w);
  if (!p) throw new Error(`missing drilldown: ${w}`);
  return p;
});

const decode = (s) => s.replace(/&amp;/g, "&");

const toc = picked
  .map(
    (p, i) =>
      `<li><span class="toc-num">${String(i + 1).padStart(2, "0")}</span><span class="toc-name">${decode(p.chapter)}</span></li>`
  )
  .join("\n        ");

// A trailing <h2> block (cyph orbits' "what the graph captures…" + its contrast
// table) is short enough to hold on one page — wrap it so the heading doesn't
// get stranded at the foot of the previous page.
const body = picked
  .map((p) =>
    p.html.replace(
      /(<h2>[\s\S]*?)(\s*<\/section>)$/,
      '<div class="keep-together">$1</div>$2'
    )
  )
  .join("\n\n");

const PRINT_CSS = `
/* ═══ print overrides — same skin, paged ═══ */
html, body {
  height: auto;
  overflow: visible;
  background: #000;
}
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Zero page margins: the @page margin box cannot be painted, so any margin
   prints as a white band and breaks the full-bleed black. All gutters live in
   the section padding instead. */
@page { size: Letter; margin: 0; }

/* the stage is no longer a fixed scroll pane */
#deck-root {
  position: static;
  overflow: visible;
  background: #000;
}

/* every drilldown prints; each starts a fresh page. !important because the
   base sheet's .drilldown.active entrance animation would otherwise freeze the
   document at opacity 0 in a static render. */
.drilldown, .drilldown.active {
  display: block !important;
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 52px 58px 58px;
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
  break-before: page;
}

/* thin paprika HUD rule at the head of each document */
.drilldown > .kicker::before {
  content: "";
  display: block;
  width: 100%;
  height: 5px;
  background: var(--paprika);
  margin: 0 0 26px;
}

/* Rounded containers clip their contents across a page break, and when a child
   is pushed to the next page the parent still paints an empty strip in the
   leftover space. So in print the container drops its chrome and each row
   carries its own border + radius — nothing clips, no orphan strips. */
.layerstack, .contrast {
  overflow: visible;
  border: none;
  border-radius: 0;
  break-inside: auto;
}
/* the contrast block is short enough to hold together on one page */
.contrast, .keep-together { break-inside: avoid; }
.layer, .contrast-row {
  overflow: hidden;
  border: 1px solid var(--line);
  border-top: none;
}
.layer:first-child, .contrast-row:first-child {
  border-top: 1px solid var(--line);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.layer:last-child, .contrast-row:last-child {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* keep atomic blocks whole across page boundaries */
.layer, .cmp-row, .contrast-row, .compare-headline, .callout,
.spec-card, tr, li, .note, .layer-rail, .layer-body { break-inside: avoid; }
h1, h2, h3 { break-after: avoid; }
p { orphans: 3; widows: 3; }
table { break-inside: auto; }
thead { display: table-header-group; }

/* no motion in a static render */
.cmp-bar { transition: none; }

/* ─── cover ─── */
.cover {
  break-after: page;
  min-height: 10.4in;
  padding: 96px 58px 58px;
  display: flex;
  flex-direction: column;
}
.cover-rule {
  height: 5px;
  background: var(--paprika);
  margin-bottom: 64px;
}
.cover .station-sign { margin-bottom: 34px; }
.cover h1 {
  font-size: 46px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0 0 14px;
  color: var(--cream);
}
.cover .cover-sub {
  font-size: 17px;
  line-height: 1.5;
  color: var(--muted);
  max-width: 520px;
  margin: 0 0 52px;
}
.cover ol.cover-toc {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
  max-width: 560px;
}
.cover ol.cover-toc li {
  display: flex;
  align-items: baseline;
  gap: 18px;
  padding: 15px 2px;
  border-bottom: 1px solid var(--line);
  font-size: 19px;
  color: var(--cream);
}
.toc-num {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--paprika);
}
.cover-foot {
  margin-top: auto;
  padding-top: 40px;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: lowercase;
  color: var(--faint);
}
`;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>cyph · appendix — technical excerpt</title>
    <style>
${css}
${PRINT_CSS}
    </style>
  </head>
  <body class="authed">
    <main id="deck-root">
      <section class="cover">
        <div class="cover-rule"></div>
        <div class="station-sign">
          <div class="station-name">internal · appendix</div>
          <div class="station-bullets">
            <span class="station-bullet paprika">C</span
            ><span class="station-bullet cornflower">Y</span
            ><span class="station-bullet amber">P</span
            ><span class="station-bullet amaranth">H</span>
          </div>
        </div>
        <h1>under the hood.</h1>
        <p class="cover-sub">
          A technical excerpt from the Cyph appendix — four drilldowns on how
          the platform is built.
        </p>
        <ol class="cover-toc">
        ${toc}
        </ol>
        <div class="cover-foot">confidential · internal</div>
      </section>

${body}
    </main>
  </body>
</html>
`;

await writeFile(OUT, html, "utf8");
console.log(`✓ wrote ${OUT} (${picked.length} drilldowns: ${picked.map((p) => p.chapter).join(", ")})`);
