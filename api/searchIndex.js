const recipes = require('../data/recipes.json');
const { slugify } = require('./_slug');

// Ingredient text is what makes search useful ("anchovy" -> Caesar dressing),
// but the stored HTML and the duplicated Text/Full_Text columns are dead weight.
// Stripping them takes the payload from ~920 KB to ~120 KB.
const stripTags = (value) =>
  String(value == null ? '' : value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const index = recipes.map((recipe) => ({
  RowID: recipe.RowID,
  Name: recipe.Name,
  Name_English: recipe.Name_English,
  Slug: slugify(recipe.Name),
  Prep_Time: recipe.Prep_Time,
  Cook_Time: recipe.Cook_Time,
  CatID: recipe.CatID,
  Type: recipe.Type,
  Type_English: recipe.Type_English,
  Mom_Recipe_Ind: recipe.Mom_Recipe_Ind,
  Ingredientes: stripTags(recipe.Ingredientes),
  Ingredients_English: stripTags(recipe.Ingredients_English),
}));

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.status(200).json(index);
};
