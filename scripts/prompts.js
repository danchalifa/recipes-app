// Builds one image-generation prompt per recipe.
// Kept as its own module so prompts can be reviewed (and re-rolled) without
// touching the generation or optimisation steps.
const path = require('path');
const recipes = require(path.join(__dirname, '..', 'data', 'recipes.json'));

// One shared photographic style across all 289 cards. Without this the grid
// looks like a stock-photo bin; with it, it reads as a single cookbook.
const STYLE =
  'Food photography, soft natural window light, shallow depth of field, ' +
  'warm appetizing tones, rustic wood or ceramic surface, clean uncluttered ' +
  'composition, editorial cookbook style. No text, no lettering, no hands, no people.';

// Framing per category: a soup wants a bowl shot, a cake wants a slice.
const FRAMING = {
  901: 'Small serving bowl of the sauce or dip beside its key ingredients, three-quarter view',
  // Category 902 covers loaves, biscuits, empanadas, crepes and dumplings, so
  // the framing has to stay wide enough to fit all of them.
  902: 'Freshly baked bread or pastry arranged on a board or plate, three-quarter view',
  903: 'Plated main course of meat, three-quarter view, sliced to show the interior',
  904: 'Plated chicken or turkey dish, three-quarter view',
  905: 'Plated seafood dish, three-quarter view, garnished simply',
  906: 'Fresh salad or vegetable dish in a wide shallow bowl, overhead view',
  907: 'Traditional Mexican dish plated authentically, three-quarter view',
  908: 'Bowl of soup, overhead view, steam rising, garnish visible',
  909: 'Japanese dish plated minimally on a dark ceramic plate, overhead view',
  910: 'Pasta or pizza served family style, overhead view',
  911: 'Light healthy portion plated simply on a white plate, overhead view',
  912: 'Cookies arranged on a cooling rack or plate, overhead view',
  913: 'Whole cake or pie with one slice cut and lifted out, three-quarter view',
  914: 'Individual dessert portion plated elegantly, three-quarter view',
};

const NOT_AN_INGREDIENT =
  /(see (the )?(directions|recipe|below)|by the eye|to taste|al gusto|as needed|optional$|ingredients?$|preparation)/i;

// Seasonings and staples that cost prompt space without changing what the
// photo looks like. "Salt and pepper" never shows up in the finished plate.
const INVISIBLE =
  /^(salt|pepper|salt and pepper|black pepper|white pepper|garlic salt|onion salt|celery salt|seasoned salt|chicken bouillon powder|chicken bouillon|beef bouillon|bouillon|consomm?e|water|hot water|warm water|cold water|ice|oil|oil for frying|cooking oil|vegetable oil|frying oil|nonstick spray|cooking spray)\b/i;

// Quantity words that survive the numeric strip ("kilo of tomato", "bag of
// beans", "sachet of yeast"). Removing them leaves the food itself.
const UNIT_WORDS =
  /^(gr|grs|gram|grams|kilos?|kg|liters?|litres?|lt|ml|bags?|bars?|sticks?|sachets?|packets?|packages?|boxes?|box|cans?|jars?|bottles?|stalks?|sprigs?|heads?|bunch(es)?|pinch(es)?|dash(es)?|handful|squares?|sheets?|drops?|cubes?|envelopes?)\.?\s+(of\s+)?/i;

// Mojibake from the source export ("Gruy¨re", "Pur¨"): drop the stray marks
// rather than shipping them into a prompt.
const MOJIBAKE = /[¨´`^~œ±]+/g;

// Recipes are written in sections ("Dough:", "Filling:", "Mass:"). Those
// headers are not food and must not reach the prompt.
const SECTION_HEADER = /:\s*$/;

// Ingredient lists are HTML with <br> separators and leading quantities.
// The model needs the *substance* ("piloncillo, raisins, peanuts"), not "1 cup of".
const keyIngredients = (recipe) => {
  const raw = recipe.Ingredients_English || recipe.Ingredientes || '';
  return raw
    .split(/<br\s*\/?>/i)
    // Non-breaking spaces survive trim() and hid section headers like "Mass:&nbsp;"
    // from the filter below, so normalise them first.
    .map((line) => line.replace(/<[^>]*>/g, '').replace(/ /g, ' ').trim())
    .filter(Boolean)
    // Drop the measurement prefix; keep the food itself.
    .filter((line) => !SECTION_HEADER.test(line))
    .map((line) =>
      line
        .replace(/\([^)]*\)/g, '')
        .replace(/^[\d\s¼½¾⅓⅔⅛/.,-]+/, '')
        .replace(
          /^(cups?|tablespoons?|teaspoons?|tbsp|tsp|pounds?|lbs?|ounces?|oz|grams?|kg|cans?|packages?|cloves?|pieces?|slices?|sticks?|bunch(es)?|pinch(es)?)\s+/i,
          ''
        )
        .replace(/^of\s+/i, '')
        .replace(UNIT_WORDS, '')
        .replace(MOJIBAKE, '')
        .replace(/,.*$/, '')
        .replace(/\.+$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter((line) => line.length > 2 && line.length < 40)
    .filter((line) => !INVISIBLE.test(line))
    // Some rows carry instructions rather than ingredients ("See Directions",
    // "By the eye of a good cube"). Feeding those to the model produces noise.
    .filter((line) => !NOT_AN_INGREDIENT.test(line))
    .slice(0, 6)
    .join(', ');
};

const buildPrompt = (recipe) => {
  const en = (recipe.Name_English || '').trim();
  const es = (recipe.Name || '').trim();
  // Lead with the English name so the model grounds on it, but keep the Spanish
  // name too: for dishes like capirotada or mole the Spanish word carries more.
  const dish =
    en && es && en.toLowerCase() !== es.toLowerCase() ? `${en} (${es})` : es || en;
  const framing = FRAMING[recipe.CatID] || 'Plated dish, three-quarter view';
  const ing = keyIngredients(recipe);
  return [`${framing}: ${dish}.`, ing ? `Made with ${ing}.` : '', STYLE]
    .filter(Boolean)
    .join(' ');
};

const all = () =>
  recipes.map((r) => ({
    id: r.RowID,
    catId: r.CatID,
    name: r.Name,
    prompt: buildPrompt(r),
  }));

module.exports = { buildPrompt, keyIngredients, all };

if (require.main === module) {
  const items = all();
  const which = process.argv[2];
  const show = which ? items.filter((i) => String(i.catId) === which) : items;
  show.slice(0, Number(process.argv[3]) || 8).forEach((i) => {
    console.log(`--- [${i.id}] ${i.name}\n${i.prompt}\n`);
  });
  console.log(`total shown: ${Math.min(show.length, Number(process.argv[3]) || 8)} / all: ${items.length}`);
}
