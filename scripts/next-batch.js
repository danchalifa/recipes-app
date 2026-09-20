// Prints the next N recipes that still have no image, as ready-to-submit
// generate_image_batch `requests` JSON.
//
//   node scripts/next-batch.js [count] [chunkSize]
//
// "Still has no image" = no public/recipe-images/<id>.webp and no id in any
// build-images/results*.json, so re-running after a partial wave is safe.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build-images');
const OUT = path.join(ROOT, 'public', 'recipe-images');

const MODEL = 'nano_banana_2_lite';

const count = Number(process.argv[2]) || 12;
const chunkSize = Number(process.argv[3]) || 12;

const prompts = JSON.parse(fs.readFileSync(path.join(BUILD, 'prompts.json'), 'utf8'));

const claimed = new Set();
for (const file of fs.readdirSync(BUILD).filter((f) => /^results.*\.json$/.test(f))) {
  for (const row of JSON.parse(fs.readFileSync(path.join(BUILD, file), 'utf8'))) {
    claimed.add(String(row.id));
  }
}
if (fs.existsSync(OUT)) {
  for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith('.webp')) claimed.add(f.replace('.webp', ''));
  }
}

const pending = prompts.filter((p) => !claimed.has(String(p.id)));
const take = pending.slice(0, count);

for (let i = 0; i < take.length; i += chunkSize) {
  const chunk = take.slice(i, i + chunkSize);
  const requests = chunk.map((p) => ({
    index: p.id,
    params: {
      model: MODEL,
      aspect_ratio: '16:9',
      use_unlim: false,
      prompt: p.prompt,
    },
  }));
  console.log(`\n===== CHUNK ${i / chunkSize + 1} (${chunk.length}) =====`);
  console.log(JSON.stringify(requests));
}

console.error(`\npending total: ${pending.length}, emitted: ${take.length}`);
