const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const preferredPort = 3000;
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

function resolveStaticFile(targetPath) {
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isFile()) return targetPath;
    if (stat.isDirectory()) {
      const idx = path.join(targetPath, "index.html");
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  }

  // Check with .html extension (e.g. /todos-os-projetos -> todos-os-projetos.html)
  if (fs.existsSync(targetPath + ".html") && fs.statSync(targetPath + ".html").isFile()) {
    return targetPath + ".html";
  }

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);

  const candidates = [];

  // 1. -1 variation
  if (base.endsWith("-1")) {
    candidates.push(path.join(dir, base.slice(0, -2) + ext));
  } else {
    candidates.push(path.join(dir, base + "-1" + ext));
  }

  // 2. alternative media extensions
  const exts = [".webp", ".jpg", ".jpeg", ".png", ".webm", ".mp4"];
  for (const altExt of exts) {
    if (altExt !== ext.toLowerCase()) {
      candidates.push(path.join(dir, base + altExt));
      if (base.endsWith("-1")) {
        candidates.push(path.join(dir, base.slice(0, -2) + altExt));
      } else {
        candidates.push(path.join(dir, base + "-1" + altExt));
      }
    }
  }

  for (const cand of candidates) {
    if (cand.startsWith(root) && fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      return cand;
    }
  }

  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${activePort}`);
  const decodedPath = decodeURIComponent(url.pathname);

  if (decodedPath === "/wp-content/uploads/portfolio/portfolio-manifest.json") {
    return sendJson(res, 200, buildPortfolioManifest());
  }

  // Mock WordPress REST API and AJAX endpoints if pinged
  if (decodedPath.startsWith("/wp-json/") || decodedPath === "/wp-admin/admin-ajax.php") {
    return sendJson(res, 200, {});
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const rawPath = path.resolve(root, relativePath);

  if (!rawPath.startsWith(root)) {
    return send(res, 403, "Forbidden");
  }

  const resolved = resolveStaticFile(rawPath);
  if (!resolved) {
    const ext = path.extname(decodedPath).toLowerCase();
    // Prevent "Unexpected token '<'" when client expects valid JS or JSON
    if (ext === ".js" || decodedPath.endsWith(".bundle.min.js")) {
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      return res.end("/* not found */");
    }
    if (ext === ".json") {
      return sendJson(res, 200, {});
    }
    if (ext === ".css") {
      res.writeHead(200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      return res.end("/* not found */");
    }
    return send(res, 404, "Not found");
  }

  const ext = path.extname(resolved).toLowerCase();
  const type = types[ext] || "application/octet-stream";
  const isMedia = imageExtensions.has(ext) || ext === ".svg" || ext === ".ico";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": isMedia ? "public, max-age=86400" : "no-cache"
  });
  fs.createReadStream(resolved).pipe(res);
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

