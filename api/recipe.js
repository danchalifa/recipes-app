const recipes = require('../data/recipes.json');
const { slugify } = require('./_slug');

// Lets /recipe/:id/:slug survive a hard refresh or a shared link instead of
// depending on router state that only exists after an in-app click.
module.exports = (req, res) => {
  const { id, slug } = req.query || {};
  res.setHeader('Content-Type', 'application/json');

  let recipe;
  if (id) {
    const rowId = parseInt(id, 10);
    recipe = recipes.find((item) => item.RowID === rowId);
  } else if (slug) {
    // Legacy links used the recipe name; two names collide, so first match wins.
    const wanted = slugify(slug);
    recipe =
      recipes.find((item) => slugify(item.Name) === wanted) ||
      recipes.find((item) => slugify(item.Name_English) === wanted);
  } else {
    res.status(400).json({ error: 'An id or slug parameter is required' });
    return;
  }

  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.status(200).json(recipe);
};
