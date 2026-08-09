const fs = require("fs");
const path = require("path");

const files = [
  "index.html",
  "wp-content/uploads/elementor/css/post-16431.css",
  "wp-content/uploads/elementor/css/post-5.css",
  "wp-content/uploads/elementor/css/custom-frontend.min.css",
  "wp-content/uploads/elementor/css/custom-widget-icon-list.min.css",
];

const aliases = new Map([
  ["wp-content/uploads/2026/01/mão-comcelular.webp", "wp-content/uploads/2026/01/mão-comcelular.webp"],
  ["wp-content/uploads/2026/01/maÌƒo-comcelular-mobilecopy.webp", "wp-content/uploads/2026/01/mão-comcelular-mobilecopy.webp"],
  ["wp-content/uploads/2026/01/solicite-orcÌ§amento-copy-1.webp", "wp-content/uploads/2026/01/solicite-orçamento-copy-1.webp"],
]);

const urlRe = /https:\/\/xperdesign\.com\.br\/([^"')\s<>]+)/g;
const urls = new Set();

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = urlRe.exec(content))) {
    urls.add(match[1].split("?")[0]);
  }
}

const report = {
  local: [],
  aliasFixable: [],
  missing: [],
};

for (const url of [...urls].sort()) {
  const decoded = decodeURIComponent(url);
  const localPath = path.join(process.cwd(), decoded);

  if (fs.existsSync(localPath)) {
    report.local.push(decoded);
    continue;
  }

  const alias = aliases.get(decoded);
  if (alias && fs.existsSync(path.join(process.cwd(), alias))) {
    report.aliasFixable.push({ from: decoded, to: alias });
    continue;
  }

  report.missing.push(decoded);
}

console.log(`Assets locais: ${report.local.length}`);
console.log(`Corrigiveis por nome/acentos: ${report.aliasFixable.length}`);
console.log(`Faltando nesta pasta: ${report.missing.length}`);

if (report.aliasFixable.length) {
  console.log("\nCorrigiveis:");
  for (const item of report.aliasFixable) {
    console.log(`- ${item.from} -> ${item.to}`);
  }
}

if (report.missing.length) {
  console.log("\nFaltando:");
  for (const item of report.missing) {
    console.log(`- ${item}`);
  }
}
