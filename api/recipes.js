const recipes = require('../data/recipes.json');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(recipes);
};
