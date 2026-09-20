// Expands a compact wave record into the results-NN.json the fetcher reads.
//
//   node scripts/record-wave.js <waveNumber> <timestamp> <id:jobId> [...]
//
// Higgsfield serves every image of one submission under the same timestamped
// prefix, so the full URL is recoverable from the job id alone. Recording waves
// this way keeps the manifests short and the generation log auditable.

const fs = require('fs');
const path = require('path');

const BASE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_33U1UcbyHjaRBKGNK2Pmwc6yCE1';

const [wave, ts, ...pairs] = process.argv.slice(2);
if (!wave || !ts || pairs.length === 0) {
  console.error('usage: record-wave.js <wave> <timestamp> <id:jobId> ...');
  process.exit(1);
}

const rows = pairs.map((pair) => {
  const idx = pair.indexOf(':');
  const id = Number(pair.slice(0, idx));
  const jobId = pair.slice(idx + 1);
  return { id, url: `${BASE}/hf_${ts}_${jobId}.png` };
});

const out = path.join(
  __dirname,
  '..',
  'build-images',
  `results-${String(wave).padStart(2, '0')}.json`
);
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
console.log(`wave ${wave}: ${rows.length} rows -> ${path.basename(out)}`);
