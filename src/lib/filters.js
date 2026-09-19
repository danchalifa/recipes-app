import { deburr, minutes, totalMinutes } from "./format";

export const SORTS = {
  name: "name",
  quickest: "quickest",
  longest: "longest",
  prep: "prep",
};

export const SORT_LABELS = {
  en: {
    name: "Name (A–Z)",
    quickest: "Quickest first",
    longest: "Longest first",
    prep: "Least prep time",
  },
  es: {
    name: "Nombre (A–Z)",
    quickest: "Más rápidas primero",
    longest: "Más largas primero",
    prep: "Menos preparación",
  },
};

// Accent- and case-insensitive substring match across every word the user typed,
// so "pollo verde" finds "Enchiladas Verdes de Pollo".
export const makeMatcher = (query) => {
  const terms = deburr(query).toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return null;
  return (haystack) => {
    const hay = deburr(haystack).toLowerCase();
    return terms.every((term) => hay.includes(term));
  };
};

const searchableText = (recipe) =>
  [
    recipe.Name,
    recipe.Name_English,
    recipe.Ingredientes,
    recipe.Ingredients_English,
  ]
    .filter(Boolean)
    .join(" ")
    // Ingredient lists are stored as HTML with <br> separators.
    .replace(/<[^>]*>/g, " ");

// Titles-only matching keeps the in-category box feeling precise; the global
// search page opts into ingredients so "anchovy" finds the Caesar dressing.
export const filterRecipes = (recipes, options = {}) => {
  const {
    query = "",
    maxMinutes = 0,
    noCook = false,
    momOnly = false,
    sort = SORTS.name,
    english = false,
    searchIngredients = false,
  } = options;

  const matcher = makeMatcher(query);

  const filtered = recipes.filter((recipe) => {
    if (matcher) {
      const haystack = searchIngredients
        ? searchableText(recipe)
        : `${recipe.Name || ""} ${recipe.Name_English || ""}`;
      if (!matcher(haystack)) return false;
    }
    if (maxMinutes > 0 && totalMinutes(recipe) > maxMinutes) return false;
    if (noCook && minutes(recipe.Cook_Time) > 0) return false;
    if (momOnly && Number(recipe.Mom_Recipe_Ind) !== 1) return false;
    return true;
  });

  return sortRecipes(filtered, sort, english);
};

export const sortRecipes = (recipes, sort, english) => {
  const byName = (a, b) => {
    const nameA = (english ? a.Name_English : a.Name) || a.Name || "";
    const nameB = (english ? b.Name_English : b.Name) || b.Name || "";
    return nameA.localeCompare(nameB, english ? "en" : "es", {
      sensitivity: "base",
    });
  };

  const sorted = recipes.slice();
  switch (sort) {
    case SORTS.quickest:
      // Tie-break on name so equal-length recipes keep a stable, readable order.
      return sorted.sort(
        (a, b) => totalMinutes(a) - totalMinutes(b) || byName(a, b)
      );
    case SORTS.longest:
      return sorted.sort(
        (a, b) => totalMinutes(b) - totalMinutes(a) || byName(a, b)
      );
    case SORTS.prep:
      return sorted.sort(
        (a, b) => minutes(a.Prep_Time) - minutes(b.Prep_Time) || byName(a, b)
      );
    default:
      return sorted.sort(byName);
  }
};

export const hasActiveFilters = (options) =>
  Boolean(options.query) ||
  options.maxMinutes > 0 ||
  options.noCook ||
  options.momOnly;
