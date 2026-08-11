const fs = require("fs");
const path = require("path");

const root = process.cwd();
const portfolioRoot = path.join(root, "wp-content", "uploads", "portfolio");
const outputPath = path.join(portfolioRoot, "portfolio-manifest.json");
const imageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function toUrl(folder, file) {
  return `/wp-content/uploads/portfolio/${folder}/${file}`;
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
      const allFiles = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith("temp_") && imageExtensions.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name);

      // Group by base name (e.g., '01', '02')
      const byBase = {};
      allFiles.forEach((f) => {
        const ext = path.extname(f).toLowerCase();
        const base = path.basename(f, ext);
        if (!byBase[base]) byBase[base] = [];
        byBase[base].push(f);
      });

      const selectedFiles = Object.keys(byBase)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
        .map((base) => {
          const files = byBase[base];
          // prefer .webp, then .gif, then .png, then .jpg
          const webp = files.find((f) => f.toLowerCase().endsWith(".webp"));
          if (webp) return webp;
          const gif = files.find((f) => f.toLowerCase().endsWith(".gif"));
          if (gif) return gif;
          const png = files.find((f) => f.toLowerCase().endsWith(".png"));
          if (png) return png;
          return files[0];
        });

      manifest[folder] = selectedFiles.map((file) => toUrl(folder, file));
      return manifest;
    }, {});
}

fs.writeFileSync(outputPath, JSON.stringify(buildPortfolioManifest(), null, 2));
console.log(`Portfolio atualizado: ${outputPath}`);

