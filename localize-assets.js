const fs = require("fs");
const path = require("path");

const root = process.cwd();
const editableExtensions = new Set([".html", ".css", ".js"]);
const aliases = new Map([
  ["wp-content/uploads/2026/01/mão-comcelular.webp", "wp-content/uploads/2026/01/mão-comcelular.webp"],
  ["wp-content/uploads/2026/01/maÌƒo-comcelular-mobilecopy.webp", "wp-content/uploads/2026/01/mão-comcelular-mobilecopy.webp"],
  ["wp-content/uploads/2026/01/solicite-orcÌ§amento-copy-1.webp", "wp-content/uploads/2026/01/solicite-orçamento-copy-1.webp"],
]);

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (editableExtensions.has(path.extname(entry.name).toLowerCase())) {
      output.push(fullPath);
    }
  }
  return output;
}

function toWebPath(filePath) {
  return `/${filePath.replaceAll("\\", "/")}`;
}

let changedFiles = 0;
let changedUrls = 0;

for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original.replace(
    /https:\/\/xperdesign\.com\.br\/([^"')?\s<>]+)(\?[^"')\s<>]*)?/g,
    (match, rawPath, query = "") => {
      let decodedPath;
      try {
        decodedPath = decodeURIComponent(rawPath);
      } catch {
        decodedPath = rawPath;
      }

      const directPath = path.join(root, decodedPath);
      if (fs.existsSync(directPath)) {
        changedUrls += 1;
        return `${toWebPath(decodedPath)}${query}`;
      }

      const alias = aliases.get(decodedPath);
      if (alias && fs.existsSync(path.join(root, alias))) {
        changedUrls += 1;
        return `${toWebPath(alias)}${query}`;
      }

      return match;
    },
  );

  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changedFiles += 1;
  }
}

console.log(`Arquivos alterados: ${changedFiles}`);
console.log(`URLs localizadas: ${changedUrls}`);
