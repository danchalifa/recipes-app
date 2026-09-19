const recipes = require('../data/recipes.json');
const { slugify } = require('./_slug');

module.exports = (req, res) => {
  const { category } = req.query || {};

  if (!category) {
    res.status(400).json({ error: 'Category parameter is required' });
    return;
  }

  const categoryId = parseInt(category, 10);
  const filteredRecipes = recipes
    .filter((recipe) => recipe.CatID === categoryId)
    .map((recipe) => ({
      // RowID is the link target and React key; Mom_Recipe_Ind drives a filter.
      RowID: recipe.RowID,
      Slug: slugify(recipe.Name),
      Name: recipe.Name,
      Name_English: recipe.Name_English,
      Ingredientes: recipe.Ingredientes,
      Direcciones: recipe.Direcciones,
      Ingredients_English: recipe.Ingredients_English,
      Directions_English: recipe.Directions_English,
      Prep_Time: recipe.Prep_Time,
      Cook_Time: recipe.Cook_Time,
      CatID: recipe.CatID,
      Type: recipe.Type,
      Type_English: recipe.Type_English,
      Mom_Recipe_Ind: recipe.Mom_Recipe_Ind,
    }));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.status(200).json(filteredRecipes);
};
