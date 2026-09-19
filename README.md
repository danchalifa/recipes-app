# Las Recetas de Mamá

A bilingual (Spanish / English) recipe site for two generations of family recipes.
React front end, static JSON data, Vercel serverless functions for the API.

## Running it locally

```bash
npm install
npm start          # http://localhost:3000
```

`src/setupProxy.js` mounts the handlers in `api/` into the Create React App dev
server, so `/api/*` works under `npm start` without the Vercel CLI. In
production Vercel serves those same files as serverless functions.

```bash
npm run build      # production bundle in build/
npm test           # smoke test
```

## Layout

```
api/                 Serverless endpoints (plain (req, res) handlers)
  types.js             GET /api/types                  categories + recipe counts
  recipesForCategory   GET /api/recipesForCategory?category=<CatID>
  recipe.js            GET /api/recipe?id=<RowID>  or  ?slug=<name-slug>
  searchIndex.js       GET /api/searchIndex            slim index for search
  recipes.js           GET /api/recipes                full dump (unused by the UI)
data/                categories.json, recipes.json  (the source of truth)
src/lib/             format.js (slug/time/name), filters.js (search + sort), api.js (cached fetch)
src/components/      One .js + .css pair per component
```

## Routes

| Route | Page |
|---|---|
| `/` | Home: banner, search, categories, featured |
| `/search?q=` | Search across every recipe, name **and** ingredients |
| `/category/:catId` | One category, with search / sort / filter |
| `/recipe/:rowId/:slug` | A recipe |
| `/recipe/:slug` | Legacy link shape, resolved by name |

Every page fetches its own data, so refreshing or sharing any URL works.
Category filter state lives in the query string (`?q=`, `?sort=`, `?max=30`,
`?nocook=1`, `?mom=1`) so a filtered view is shareable and the back button
steps through it.

## Admin

Recipes are edited at `/admin`. The route is deliberately absent from the nav,
the footer and every link on the site, but that is tidiness, not security: the
page ships inside the public JS bundle, so anyone who looks will find it. The
protection is the password check in `api/admin.js`, which runs on the server for
every request. An unauthenticated visitor reaching `/admin` sees a login box and
can read nothing.

Signing in exchanges the shared password for an HMAC-signed, `HttpOnly`,
`SameSite=Strict` cookie that expires after 12 hours. The expiry is part of the
signed payload, so it cannot be extended by editing the cookie.

### Why edits go through GitHub

Vercel's filesystem is read-only at runtime, so a save cannot write to
`data/recipes.json` in place. Instead `api/_github.js` commits the updated file
through the GitHub Contents API, which triggers the normal Vercel deploy. An
edit is therefore live in about a minute rather than instantly.

The payoff: every read path stays as it was, each edit is an ordinary commit
with full history, and a bad save is undone with `git revert`. A database would
have meant rewriting all five handlers, and the API responses are cached with
`s-maxage=86400` -- an edit would have been invisible behind the CDN for a day,
whereas a deploy busts that cache for free.

Concurrent edits are caught rather than silently merged: the blob SHA the form
was opened with is checked on save, and a stale one returns 409.

### Setup

Copy `.env.example` to `.env.local` for local work, and set the same variables
in the Vercel project for production. `ADMIN_PASSWORD`, `ADMIN_SECRET`,
`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`. The token should be
fine-grained, limited to this repository, with Contents: Read and write.

### Editing rules worth knowing

- Ingredients and directions are edited one item per line; the server converts
  lines to the stored `<br>` markup. A blank line becomes a section break
  (`<br><br>`), which about 125 recipes rely on to separate "Pasta:" from
  "Relleno:".
- Recipe bodies are rendered with `dangerouslySetInnerHTML`, so the server
  escapes `&`, `<` and `>` on save and re-introduces only `<br>`. An allowlist
  of one tag, applied on the way in.
- `Type` and `Type_English` are derived from the chosen `CatID` and ignored if
  the client sends them, so they cannot drift from `categories.json`.
- New recipes get `max(RowID) + 1`.
- `Page`, `Text` and `English_Full_Text` are unread by any page; they are
  preserved on edit and left empty on new recipes.

## Data notes

- `Prep_Time` / `Cook_Time` are numeric strings in minutes; `"0"` means none.
- `Mom_Recipe_Ind` is `1` for the 70 recipes attributed to Mamá.
- Two recipe names are duplicated across rows, which is why `RowID`, not the
  slug, is the canonical identifier in URLs.
- Ingredient and direction bodies are HTML with `<br>` separators.

Copyright (c) 2021 Dan Chalifa - Michael Gardner | RECETAS DE MAMA | All rights reserved
