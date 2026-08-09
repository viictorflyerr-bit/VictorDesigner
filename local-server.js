const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const preferredPort = Number(process.env.PORT || 3000);
let activePort = preferredPort;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const imageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body, null, 2));
}

function toUrl(folder, file) {
  return "/wp-content/uploads/portfolio/" + [folder, file].map(encodeURIComponent).join("/");
}

function buildPortfolioManifest() {
  const portfolioRoot = path.join(root, "wp-content", "uploads", "portfolio");

  if (!fs.existsSync(portfolioRoot)) {
    return {};
  }

  return fs
    .readdirSync(portfolioRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
    .reduce((manifest, folder) => {
      const folderPath = path.join(portfolioRoot, folder);
      const images = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
        .map((file) => toUrl(folder, file));

      manifest[folder] = images;
      return manifest;
    }, {});
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${activePort}`);
  const decodedPath = decodeURIComponent(url.pathname);

  if (decodedPath === "/wp-content/uploads/portfolio/portfolio-manifest.json") {
    return sendJson(res, 200, buildPortfolioManifest());
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      return send(res, 404, "Not found");
    }

    const type = types[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(res);
  });
});

function listen(port) {
  activePort = port;
  server.listen(port, "0.0.0.0");
}

server.on("listening", () => {
  console.log(`Xper Design local: http://0.0.0.0:${activePort}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && activePort < preferredPort + 20) {
    console.log(`Porta ${activePort} ocupada, tentando ${activePort + 1}...`);
    listen(activePort + 1);
    return;
  }

  throw error;
});

listen(preferredPort);

