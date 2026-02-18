const recipes = require('../data/recipes.json');

module.exports = (req, res) => {
  const { category } = req.query;

  if (!category) {
    res.status(400).json({ error: 'Category parameter is required' });
    return;
  }

  const categoryId = parseInt(category, 10);
  const filteredRecipes = recipes
    .filter(recipe => recipe.CatID === categoryId)
    .map(recipe => ({
      Name: recipe.Name,
      Name_English: recipe.Name_English,
      Ingredientes: recipe.Ingredientes,
      Direcciones: recipe.Direcciones,
      Ingredients_English: recipe.Ingredients_English,
      Directions_English: recipe.Directions_English,
      Prep_Time: recipe.Prep_Time,
      Cook_Time: recipe.Cook_Time,
      CatID: recipe.CatID
    }));

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(filteredRecipes);
};
