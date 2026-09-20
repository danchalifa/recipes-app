// Validation and normalisation for recipes arriving from the admin form.
//
// The recipe page renders ingredients and directions with dangerouslySetInnerHTML,
// so anything stored here ends up as live markup. The stored data uses exactly one
// tag and no entities (6590 <br>, nothing else), so rather than trying to filter
// bad markup out on the way to the screen we escape everything on the way in and
// re-introduce only <br>. An allowlist of one tag is a boundary that cannot be
// talked around.

const categories = require('../data/categories.json');

// Only &, < and > are escaped. This text is inserted between tags, never into an
// attribute value, and in that position a quote is an ordinary character -- so
// encoding apostrophes would churn "cow's milk" into "cow&#39;s milk" on every
// save for no gain. Escaping < stops any tag from forming and escaping & stops
// any entity from forming, which is the whole attack surface here.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

const escapeHtml = (value) =>
  String(value == null ? '' : value).replace(/[&<>]/g, (char) => ESCAPES[char]);

// Textarea (one item per line) -> stored markup.
const linesToHtml = (value) => {
  const lines = String(value == null ? '' : value)
    .split(/\r?\n/)
    .map((line) => escapeHtml(line.trim()));

  // A blank line in the middle is meaningful: about one recipe in five uses one
  // to separate sections ("Pasta:" from "Relleno:"), stored as <br><br>.
  // Dropping every empty line would silently merge those sections together.
  // Only the blank lines at the very start and end are noise.
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();

  return lines.join('<br>');
};

// Stored markup -> textarea, so an existing recipe can be loaded back into the
// form without the author ever seeing a tag or an entity.
const htmlToLines = (value) =>
  String(value == null ? '' : value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Ampersand last, otherwise "&amp;lt;" would decode twice.
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

// Times are stored as numeric strings ("5", "0"). Keep that shape.
const normalizeTime = (value) => {
  const parsed = parseInt(value, 10);
  return String(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
};

// Names are rendered by React as text, not as markup, so React escapes them at
// render time. Entity-encoding them here as well would put a literal "&#39;" on
// the page for every "Auntie Anne's Pretzels". Strip angle brackets so nothing
// can look like a tag, and otherwise store the characters as typed.
const plainText = (value, max) => {
  const text = String(value == null ? '' : value)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return max ? text.slice(0, max) : text;
};

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.validation = true;
  }
}

// `existing` is the current record on an edit, so fields the form does not own
// (Page, Text, English_Full_Text) survive untouched instead of being dropped.
const normalizeRecipe = (input, { rowId, existing }) => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('No recipe data was submitted.');
  }

  const name = String(input.Name == null ? '' : input.Name).trim();
  if (!name) throw new ValidationError('The Spanish name is required.');

  const catId = parseInt(input.CatID, 10);
  // Type and Type_English are denormalised copies of the category. Deriving them
  // from CatID rather than trusting the form is what stops the two files drifting.
  const category = categories.find((item) => item.CatID === catId);
  if (!category) throw new ValidationError('Pick a valid category.');

  const ingredientes = linesToHtml(input.Ingredientes);
  if (!ingredientes) throw new ValidationError('At least one ingredient is required.');

  const direcciones = linesToHtml(input.Direcciones);
  if (!direcciones) throw new ValidationError('Directions are required.');

  return {
    RowID: rowId,
    Name: plainText(name, 200),
    Name_English: plainText(input.Name_English, 200),
    Prep_Time: normalizeTime(input.Prep_Time),
    Cook_Time: normalizeTime(input.Cook_Time),
    CatID: catId,
    Type: category.Type,
    Type_English: category.Type_English,
    // Unused by any read path, but preserved so the record shape stays uniform.
    Page: existing ? existing.Page : null,
    Mom_Recipe_Ind: input.Mom_Recipe_Ind ? 1 : 0,
    Ingredientes: ingredientes,
    Direcciones: direcciones,
    Text: existing ? existing.Text : '',
    Ingredients_English: linesToHtml(input.Ingredients_English),
    Directions_English: linesToHtml(input.Directions_English),
    English_Full_Text: existing ? existing.English_Full_Text : '',
  };
};

// Shape the admin form consumes: markup converted back to plain lines.
const toFormValues = (recipe) => ({
  RowID: recipe.RowID,
  Name: recipe.Name || '',
  Name_English: recipe.Name_English || '',
  Prep_Time: recipe.Prep_Time || '0',
  Cook_Time: recipe.Cook_Time || '0',
  CatID: recipe.CatID,
  Mom_Recipe_Ind: recipe.Mom_Recipe_Ind ? 1 : 0,
  Ingredientes: htmlToLines(recipe.Ingredientes),
  Direcciones: htmlToLines(recipe.Direcciones),
  Ingredients_English: htmlToLines(recipe.Ingredients_English),
  Directions_English: htmlToLines(recipe.Directions_English),
});

module.exports = {
  normalizeRecipe,
  toFormValues,
  htmlToLines,
  linesToHtml,
  escapeHtml,
  ValidationError,
};
