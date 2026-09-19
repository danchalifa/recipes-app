// Vercel's filesystem is read-only at runtime, so an admin edit cannot be
// written back to data/recipes.json in place. Instead we commit the new file
// through the GitHub Contents API; that push triggers the usual Vercel deploy
// and the existing handlers pick the data up when they next cold start.
//
// The cost is ~1-2 minutes before an edit is live. The payoff is that every
// read path stays exactly as it was, edits get real version history, and a bad
// save can be undone with git revert.

// Overridable only so the admin flow can be exercised against a local stub
// during development. Unset in production, where it is the real API.
const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const FILE_PATH = 'data/recipes.json';

const config = () => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'master';

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be configured');
  }
  return { token, repo, branch };
};

const headers = (token, accept) => ({
  Authorization: `Bearer ${token}`,
  Accept: accept || 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  // GitHub rejects API requests that arrive without one.
  'User-Agent': 'recetas-de-mama-admin',
});

// data/recipes.json is stored one recipe per line: `[{...},\n{...}]`. Editing a
// single recipe then shows up as a one-line diff instead of rewriting all 922 KB,
// which keeps the commit history reviewable. Must stay byte-compatible with the
// file as it exists today.
const serialize = (recipes) =>
  `[${recipes.map((recipe) => JSON.stringify(recipe)).join(',\n')}]\n`;

const readRecipes = async () => {
  const { token, repo, branch } = config();
  const ref = encodeURIComponent(branch);

  // The blob SHA comes from the directory listing rather than from the file
  // itself: the normal contents response only inlines content below 1 MB, and
  // recipes.json is already ~920 KB. Listing the directory returns metadata
  // (including the SHA we need for the write) without any content at all.
  const listRes = await fetch(`${API}/repos/${repo}/contents/data?ref=${ref}`, {
    headers: headers(token),
  });
  if (!listRes.ok) {
    throw new Error(`GitHub directory listing failed (${listRes.status})`);
  }
  const entry = (await listRes.json()).find((item) => item.name === 'recipes.json');
  if (!entry) throw new Error(`${FILE_PATH} not found on ${branch}`);

  // Accept: raw streams the file regardless of size, sidestepping the same 1 MB
  // base64 ceiling.
  const rawRes = await fetch(`${API}/repos/${repo}/contents/${FILE_PATH}?ref=${ref}`, {
    headers: headers(token, 'application/vnd.github.raw'),
  });
  if (!rawRes.ok) {
    throw new Error(`GitHub file read failed (${rawRes.status})`);
  }

  return { recipes: JSON.parse(await rawRes.text()), sha: entry.sha };
};

// `sha` is the blob we believe we are replacing. GitHub rejects the write with a
// 409 if the file moved on in the meantime, which gives us optimistic locking
// for free: two overlapping edits fail loudly instead of silently clobbering.
const writeRecipes = async (recipes, sha, message) => {
  const { token, repo, branch } = config();

  const res = await fetch(`${API}/repos/${repo}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(serialize(recipes), 'utf8').toString('base64'),
      sha,
      branch,
    }),
  });

  if (res.status === 409 || res.status === 422) {
    const error = new Error('The recipe file changed since this page loaded.');
    error.conflict = true;
    throw error;
  }
  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status})`);
  }

  const body = await res.json();
  return { commit: body.commit && body.commit.sha };
};

module.exports = { readRecipes, writeRecipes, serialize };
