// Dumps every recipe prompt to build/prompts.json so the generation driver can
// walk them in fixed order and resume after a partial run.
const fs = require('fs');
const path = require('path');
const { all } = require('./prompts');

const outDir = path.join(__dirname, '..', 'build-images');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'prompts.json');
const items = all();
fs.writeFileSync(out, JSON.stringify(items, null, 2));
console.log(`wrote ${items.length} prompts -> ${out}`);
