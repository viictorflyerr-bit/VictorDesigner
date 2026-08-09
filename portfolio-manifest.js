const fs = require("fs");
const path = require("path");

const root = process.cwd();
const portfolioRoot = path.join(root, "wp-content", "uploads", "portfolio");
const outputPath = path.join(portfolioRoot, "portfolio-manifest.json");
const imageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function toUrl(folder, file) {
  return "/wp-content/uploads/portfolio/" + [folder, file].map(encodeURIComponent).join("/");
}

function buildPortfolioManifest() {
  if (!fs.existsSync(portfolioRoot)) {
    fs.mkdirSync(portfolioRoot, { recursive: true });
    return {};
  }

  return fs
    .readdirSync(portfolioRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
    .reduce((manifest, folder) => {
      const folderPath = path.join(portfolioRoot, folder);
      manifest[folder] = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
        .map((file) => toUrl(folder, file));

      return manifest;
    }, {});
}

fs.writeFileSync(outputPath, JSON.stringify(buildPortfolioManifest(), null, 2));
console.log(`Portfolio atualizado: ${outputPath}`);

