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

## Data notes

- `Prep_Time` / `Cook_Time` are numeric strings in minutes; `"0"` means none.
- `Mom_Recipe_Ind` is `1` for the 70 recipes attributed to Mamá.
- Two recipe names are duplicated across rows, which is why `RowID`, not the
  slug, is the canonical identifier in URLs.
- Ingredient and direction bodies are HTML with `<br>` separators.

Copyright (c) 2021 Dan Chalifa - Michael Gardner | RECETAS DE MAMA | All rights reserved
