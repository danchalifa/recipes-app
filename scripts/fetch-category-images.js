// Downloads the generated category-tile banners and writes them to
// public/category-images/<CatID>.webp.
//
// Separate from fetch-images.js because the tiles are a different shape: wide
// and short (roughly 3:1) rather than the 16:9 recipe card, so they are sized
// and cropped differently.
//
// Requires `cwebp` on PATH (brew install webp).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build-images');
const RAW = path.join(BUILD, 'raw-categories');
const OUT = path.join(ROOT, 'public', 'category-images');

// Tiles render at most ~290px wide, so 640 covers 2x on a desktop and the
// full-bleed row on a phone.
const WIDTH = 640;
const QUALITY = 62;

const force = process.argv.includes('--force');

const download = async (url, dest) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
};

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs
    .readdirSync(BUILD)
    .filter((f) => /^categories.*\.json$/.test(f))
    .sort();
  const byId = new Map();
  for (const file of files) {
    for (const row of JSON.parse(fs.readFileSync(path.join(BUILD, file), 'utf8'))) {
      byId.set(row.id, row);
    }
  }

  let done = 0;
  let bytes = 0;
  for (const { id, url } of byId.values()) {
    const webp = path.join(OUT, `${id}.webp`);
    const png = path.join(RAW, `${id}.png`);
    if (force || !fs.existsSync(png)) await download(url, png);
    execFileSync('cwebp', ['-quiet', '-q', String(QUALITY), '-resize', String(WIDTH), '0', png, '-o', webp]);
    const size = fs.statSync(webp).size;
    bytes += size;
    done++;
    process.stdout.write(`${id}:${Math.round(size / 1024)}KB `);
  }

  console.log(
    `\n\nwrote ${done} | total ${Math.round(bytes / 1024)} KB, avg ${Math.round(bytes / done / 1024)} KB`
  );
})();
