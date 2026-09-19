// Shared, framework-free helpers for recipe data.
// Kept dependency-free so both the browser bundle and the /api handlers can use them.

// Strip accents so "Platillos Típicos" is findable by typing "tipicos".
export const deburr = (value) =>
  String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export const slugify = (value) =>
  deburr(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Prep_Time / Cook_Time arrive as numeric strings ("10", "0"). Be forgiving anyway.
export const minutes = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const totalMinutes = (recipe) =>
  minutes(recipe.Prep_Time) + minutes(recipe.Cook_Time);

// "1 h 30 min" reads better than "90 min" on a narrow card.
export const formatMinutes = (value, english) => {
  const total = minutes(value);
  if (total === 0) return english ? "None" : "Nada";
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const recipeName = (recipe, english) =>
  (english ? recipe.Name_English : recipe.Name) || recipe.Name || "";

export const categoryName = (category, english) => {
  if (!category) return "";
  return (english ? category.Type_English : category.Type) || category.Type || "";
};

// Names collide (two "Pastel de Atún"), so RowID is the canonical key and the
// slug is decoration that keeps the URL readable.
export const recipePath = (recipe) =>
  `/recipe/${recipe.RowID}/${slugify(recipe.Name)}`;

// Deterministic tile colour: the same recipe always gets the same swatch, so
// nothing reshuffles when the list is filtered or re-sorted.
export const swatchIndex = (recipe, buckets = 5) => {
  const seed = Number(recipe.RowID) || slugify(recipe.Name).length;
  return seed % buckets;
};
