// Recipe photos are plain files in the repo -- public/recipe-images/<RowID>.webp --
// served straight off the CDN, with no field for them in recipes.json. So
// "upload a photo" means the same thing a data edit already means here: commit a
// file through the GitHub Contents API and let the push redeploy the site.
//
// The browser resizes, crops and encodes before anything reaches this file (see
// admin.js): what arrives is a ~20 KB 480x270 WebP, not the 4 MB JPEG that came
// off a phone. That keeps this side small -- no image library, nothing that
// strains the serverless function limit -- but it also means nothing here can
// trust the client, hence the checks below.

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const DIR = 'public/recipe-images';

// Generously above a 480x270 WebP (~15-25 KB). Anything bigger did not come from
// the admin form, so it is refused rather than committed.
const MAX_BYTES = 400 * 1024;

const config = () => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'master';

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be configured');
  }
  return { token, repo, branch };
};

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'recetas-de-mama-admin',
});

class ImageError extends Error {
  constructor(message) {
    super(message);
    this.validation = true;
  }
}

// A WebP file is a RIFF container: "RIFF", four bytes of length, then "WEBP".
// Checking the container is what stops this endpoint from being a way to commit
// an arbitrary file into the repository under a .webp name.
const decodeWebp = (value) => {
  const base64 = String(value || '').replace(/^data:[^,]*,/, '');
  if (!base64) throw new ImageError('The photo was empty.');

  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length) throw new ImageError('The photo could not be read.');
  if (bytes.length > MAX_BYTES) {
    throw new ImageError('That photo is too large. Try a smaller image.');
  }
  if (
    bytes.length < 12 ||
    bytes.toString('ascii', 0, 4) !== 'RIFF' ||
    bytes.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new ImageError('That file is not a WebP image.');
  }
  return bytes;
};

// The Contents API needs the blob SHA to replace a file and refuses one when
// creating it, so an existing photo has to be looked up first. A 404 here is the
// ordinary case: a recipe that has never had a photo.
const currentSha = async ({ token, repo, branch }, path) => {
  const res = await fetch(
    `${API}/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { headers: headers(token) }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub image lookup failed (${res.status})`);
  return (await res.json()).sha;
};

// Committed separately from recipes.json, and always after it, because the
// Contents API writes one file per call. If this fails the recipe itself is
// still saved and falls back to its coloured swatch -- exactly what every recipe
// without a photo already does.
const writeRecipeImage = async (rowId, value) => {
  const bytes = decodeWebp(value);
  const settings = config();
  const path = `${DIR}/${rowId}.webp`;
  const sha = await currentSha(settings, path);

  const res = await fetch(`${API}/repos/${settings.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(settings.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `${sha ? 'Update' : 'Add'} photo for recipe ${rowId}`,
      content: bytes.toString('base64'),
      branch: settings.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub image write failed (${res.status})`);
  }

  const body = await res.json();
  return { commit: body.commit && body.commit.sha, path };
};

module.exports = { writeRecipeImage, decodeWebp, ImageError, MAX_BYTES };
