// Single endpoint behind /api/admin, dispatching on `action` in the POST body.
// Folding login/load/save into one function keeps the project well inside the
// serverless function limit on Vercel's free tier.

const { checkPassword, verifyRequest, loginCookie, logoutCookie } = require('./_auth');
const { readRecipes, writeRecipes } = require('./_github');
const { writeRecipeImage } = require('./_images');
const { normalizeRecipe, toFormValues, ValidationError } = require('./_recipe');

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const send = (res, status, body, cookie) => {
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.setHeader('Content-Type', 'application/json');
  // Nothing under /api/admin may ever be cached by the CDN or the browser.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).json(body);
};

const summarise = (recipes) =>
  recipes
    .map((recipe) => ({
      RowID: recipe.RowID,
      Name: recipe.Name,
      Name_English: recipe.Name_English,
      Type: recipe.Type,
      CatID: recipe.CatID,
    }))
    .sort((a, b) => String(a.Name).localeCompare(String(b.Name), 'es'));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const body = req.body || {};
  const action = String(body.action || '');

  try {
    if (action === 'login') {
      if (!checkPassword(body.password)) {
        // Serverless instances share no memory, so a counter-based lockout would
        // not hold. A fixed delay blunts naive guessing; the real protection is
        // that ADMIN_PASSWORD is a long passphrase.
        await pause(600);
        return send(res, 401, { error: 'Incorrect password.' });
      }
      return send(res, 200, { ok: true }, loginCookie());
    }

    if (action === 'logout') {
      return send(res, 200, { ok: true }, logoutCookie());
    }

    if (action === 'session') {
      return send(res, 200, { authenticated: verifyRequest(req) });
    }

    // Everything past this point writes or exposes data, so it is gated.
    if (!verifyRequest(req)) {
      return send(res, 401, { error: 'Not signed in.' });
    }

    if (action === 'list') {
      const { recipes, sha } = await readRecipes();
      return send(res, 200, { recipes: summarise(recipes), sha });
    }

    if (action === 'load') {
      const { recipes, sha } = await readRecipes();
      const recipe = recipes.find((item) => item.RowID === parseInt(body.id, 10));
      if (!recipe) return send(res, 404, { error: 'Recipe not found.' });
      return send(res, 200, { values: toFormValues(recipe), sha });
    }

    if (action === 'save') {
      // Re-read rather than trusting anything the client cached: this gives both
      // the current blob SHA for the write and a fresh base to mutate.
      const { recipes, sha } = await readRecipes();

      // body.sha is what the file looked like when the form was opened. If it has
      // moved on, someone else saved in the meantime and blindly writing would
      // discard their edit.
      if (body.sha && body.sha !== sha) {
        return send(res, 409, {
          error: 'Someone else saved a change while this form was open. Reload and redo your edit.',
        });
      }

      const isCreate = body.id == null || body.id === '';
      let rowId;
      let existing = null;
      let next;

      if (isCreate) {
        // max + 1, never length: a future delete would otherwise reissue a live id.
        rowId = recipes.reduce((max, item) => Math.max(max, Number(item.RowID) || 0), 0) + 1;
        next = recipes.concat([normalizeRecipe(body.recipe, { rowId, existing: null })]);
      } else {
        rowId = parseInt(body.id, 10);
        const index = recipes.findIndex((item) => item.RowID === rowId);
        if (index === -1) return send(res, 404, { error: 'Recipe not found.' });
        existing = recipes[index];
        next = recipes.slice();
        next[index] = normalizeRecipe(body.recipe, { rowId, existing });
      }

      const label = (isCreate ? next[next.length - 1] : next.find((r) => r.RowID === rowId)).Name;
      const { commit } = await writeRecipes(
        next,
        sha,
        `${isCreate ? 'Add' : 'Update'} recipe: ${label}`
      );

      // The photo is a second commit, and deliberately after the recipe: the
      // Contents API writes one file at a time, and if this half fails the
      // recipe is already safely saved and shows its coloured swatch instead.
      // A new recipe's RowID only exists once the block above has run, which is
      // why the image cannot be uploaded before the save.
      let imageError = null;
      if (body.image) {
        try {
          await writeRecipeImage(rowId, body.image);
        } catch (error) {
          if (error.validation) {
            imageError = error.message;
          } else {
            console.error('[admin] image', error);
            imageError = 'The recipe saved, but the photo did not upload.';
          }
        }
      }

      return send(res, 200, { ok: true, rowId, commit, created: isCreate, imageError });
    }

    return send(res, 400, { error: 'Unknown action.' });
  } catch (error) {
    if (error instanceof ValidationError || error.validation) {
      return send(res, 400, { error: error.message });
    }
    if (error.conflict) {
      return send(res, 409, { error: error.message });
    }
    // Misconfiguration and GitHub failures can carry tokens or repo detail in the
    // message, so log it and hand the browser something generic.
    console.error('[admin]', error);
    return send(res, 500, { error: 'The save failed. Check the server logs.' });
  }
};
