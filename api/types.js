const categories = require('../data/categories.json');
const recipes = require('../data/recipes.json');

// Pre-compute counts once at module load; the data is static JSON.
const counts = recipes.reduce((acc, recipe) => {
  acc[recipe.CatID] = (acc[recipe.CatID] || 0) + 1;
  return acc;
}, {});

// RecipeCount lets the home page show how much is behind each tile without
// pulling the whole recipe file into the browser.
const withCounts = categories.map((category) => ({
  ...category,
  RecipeCount: counts[category.CatID] || 0,
}));

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.status(200).json(withCounts);
};
