// Tiny fetch layer with an in-memory cache. The category page, the recipe page
// and the search page all want the same two payloads; without the cache a user
// walking Home -> Category -> Recipe -> back refetches on every hop.

const cache = new Map();

const getJSON = (url) => {
  if (!cache.has(url)) {
    const request = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} responded ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        // Never cache a failure, otherwise a flaky first load is permanent.
        cache.delete(url);
        throw err;
      });
    cache.set(url, request);
  }
  return cache.get(url);
};

export const fetchCategories = () => getJSON("/api/types");

export const fetchRecipesForCategory = (categoryId) =>
  getJSON(`/api/recipesForCategory?category=${encodeURIComponent(categoryId)}`);

// Slim payload (~45 KB) used to power global search without shipping the full
// 900 KB recipe file to the browser.
export const fetchSearchIndex = () => getJSON("/api/searchIndex");

export const fetchRecipe = (id) =>
  getJSON(`/api/recipe?id=${encodeURIComponent(id)}`);

export const fetchRecipeBySlug = (slug) =>
  getJSON(`/api/recipe?slug=${encodeURIComponent(slug)}`);
