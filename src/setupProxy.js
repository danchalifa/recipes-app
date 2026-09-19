/* eslint-disable */
// Without this, `npm start` serves the React app but nothing serves /api,
// because the handlers in api/ are Vercel serverless functions. CRA loads this
// file automatically and hands us the dev server's Express app, so we can mount
// the very same handlers locally. Not used in production.
const types = require('../api/types');
const recipes = require('../api/recipes');
const recipesForCategory = require('../api/recipesForCategory');
const searchIndex = require('../api/searchIndex');
const recipe = require('../api/recipe');

module.exports = function (app) {
  app.get('/api/types', types);
  app.get('/api/recipes', recipes);
  app.get('/api/recipesForCategory', recipesForCategory);
  app.get('/api/searchIndex', searchIndex);
  app.get('/api/recipe', recipe);
};
