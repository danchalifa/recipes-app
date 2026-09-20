// Downloads generated PNGs and writes card-sized WebPs into public/recipe-images.
//
// Input: build-images/results.json — [{ id, url }, ...] appended by the
// generation driver. Re-running is safe: an id whose .webp already exists is
// skipped unless --force is passed.
//
// Requires `cwebp` on PATH (brew install webp).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build-images');
const RAW = path.join(BUILD, 'raw');
const OUT = path.join(ROOT, 'public', 'recipe-images');

// 480px wide covers the card at 1x on desktop and 2x on a phone, where the
// thumbnail is 96px. q60 measured ~20 KB per image with no visible artifacts.
const WIDTH = 480;
const QUALITY = 60;

const force = process.argv.includes('--force');

const download = async (url, dest) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
};

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  // One file per generation wave (results-01.json, ...), merged here so a wave
  // can be added or re-rolled without rewriting a single growing manifest.
  const files = fs
    .readdirSync(BUILD)
    .filter((f) => /^results.*\.json$/.test(f))
    .sort();
  const byId = new Map();
  for (const file of files) {
    for (const row of JSON.parse(fs.readFileSync(path.join(BUILD, file), 'utf8'))) {
      byId.set(row.id, row); // later waves win, so a re-roll overrides
    }
  }
  const results = [...byId.values()];
  console.log(`${files.length} wave file(s) -> ${results.length} unique recipes`);

  let done = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (const { id, url } of results) {
    const webp = path.join(OUT, `${id}.webp`);
    if (!force && fs.existsSync(webp)) {
      skipped++;
      bytes += fs.statSync(webp).size;
      continue;
    }
    const png = path.join(RAW, `${id}.png`);
    try {
      if (force || !fs.existsSync(png)) await download(url, png);
      execFileSync('cwebp', ['-quiet', '-q', String(QUALITY), '-resize', String(WIDTH), '0', png, '-o', webp]);
      const size = fs.statSync(webp).size;
      bytes += size;
      done++;
      process.stdout.write(`${id}:${Math.round(size / 1024)}KB `);
    } catch (err) {
      failed++;
      console.error(`\n  FAILED ${id}: ${err.message}`);
    }
  }

  const count = done + skipped;
  console.log(
    `\n\nwrote ${done}, skipped ${skipped}, failed ${failed}` +
      (count ? ` | total ${(bytes / 1048576).toFixed(2)} MB, avg ${Math.round(bytes / count / 1024)} KB` : '')
  );
})();
