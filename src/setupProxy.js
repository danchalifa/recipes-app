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
const admin = require('../api/admin');

// Vercel parses a JSON request body into req.body before invoking a function;
// the dev server does not. Hand-rolled rather than pulling in body-parser, which
// is only present here as a transitive dependency of react-scripts.
const jsonBody = (req, res, next) => {
  let raw = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      req.body = {};
    }
    next();
  });
};

module.exports = function (app) {
  app.get('/api/types', types);
  app.get('/api/recipes', recipes);
  app.get('/api/recipesForCategory', recipesForCategory);
  app.get('/api/searchIndex', searchIndex);
  app.get('/api/recipe', recipe);
  // ADMIN_PASSWORD, ADMIN_SECRET, GITHUB_TOKEN and GITHUB_REPO come from
  // .env.local locally; react-scripts loads that file into process.env before
  // this module runs. In production they are Vercel environment variables.
  app.post('/api/admin', jsonBody, admin);
};
