// One-off script: downloads the "latin" subsets of Inter/Poppins from Google Fonts
// into public/fonts and emits public/fonts/fonts.css with relative URLs.
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "fonts.css"), "utf8");
const blocks = css.split("/*").map((b) => "/*" + b);

const picks = [];
for (const block of blocks) {
  if (!block.startsWith("/* latin */")) continue;
  const fam = /font-family: '([^']+)'/.exec(block)?.[1];
  const weight = /font-weight: (\d+)/.exec(block)?.[1];
  const url = /url\((https:[^)]+)\)/.exec(block)?.[1];
  if (fam && weight && url) {
    picks.push({ fam: fam.toLowerCase(), weight, url });
  }
}

(async () => {
  let out = "/* Self-hosted latin subsets of Inter and Poppins (Google Fonts, OFL license) */\n";
  for (const p of picks) {
    const name = `${p.fam}-${p.weight}.woff2`;
    const res = await fetch(p.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!res.ok) throw new Error(`Failed ${p.url}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(__dirname, "public", "fonts", name), buf);
    out += `@font-face {\n  font-family: '${p.fam === "inter" ? "Inter" : "Poppins"}';\n  font-style: normal;\n  font-weight: ${p.weight};\n  font-display: swap;\n  src: url('/fonts/${name}') format('woff2');\n}\n`;
    console.log("saved", name, buf.length, "bytes");
  }
  fs.writeFileSync(path.join(__dirname, "public", "fonts", "fonts.css"), out);
  console.log("done");
})();
