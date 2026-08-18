const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

const coversDir = path.join(__dirname, 'wp-content', 'uploads', 'covers');
fs.mkdirSync(coversDir, { recursive: true });

const coverList = [
  { name: 'cover-apostamax.webp', url: 'https://i.postimg.cc/RVS5PHBH/CAPA.png' },
  { name: 'cover-trafego-pago.webp', url: 'https://i.postimg.cc/DwhgQr3n/CAPA.png' },
  { name: 'cover-ana-castro.webp', url: 'https://i.postimg.cc/zGg31F8f/CAPA.png' },
  { name: 'cover-cbeer-bar.webp', url: 'https://i.postimg.cc/t4ZDQwsF/CAPA.png' },
  { name: 'cover-edirlene.webp', url: 'https://i.postimg.cc/2yDM0TN1/CAPA.png' },
  { name: 'cover-mikael-iphones.webp', url: 'https://i.postimg.cc/N0PpyDjz/CAPA.png' },
  { name: 'cover-paneco.webp', url: 'https://i.ibb.co/8DXSQxgq/CAPA.png' }
];

function fetchWithRedirect(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const origin = new URL(url).origin;
          redirectUrl = new URL(redirectUrl, origin).href;
        }
        return fetchWithRedirect(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed ${url}: HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout downloading ${url}`)); });
    req.on('error', reject);
  });
}

async function optimizeCovers() {
  console.log('Downloading and optimizing 7 covers...');
  for (const item of coverList) {
    const dest = path.join(coversDir, item.name);
    console.log(`Fetching ${item.name} from ${item.url}...`);
    try {
      const raw = await fetchWithRedirect(item.url);
      console.log(` Raw size: ${(raw.length / 1024).toFixed(1)} KB. Converting with Sharp...`);
      await sharp(raw)
        .resize({ width: 720, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(dest);
      const stat = fs.statSync(dest);
      console.log(` Saved ${item.name}: ${(stat.size / 1024).toFixed(1)} KB (INSTANT local load)`);
    } catch (err) {
      console.error(` Error processing ${item.name}:`, err.message);
    }
  }
  console.log('Finished optimizing covers!');
}

optimizeCovers();
