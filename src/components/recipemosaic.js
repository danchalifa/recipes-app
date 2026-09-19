import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { fetchCategories, fetchRecipesForCategory } from "../lib/api";
import { categoryName } from "../lib/format";
import { filterRecipes, hasActiveFilters, SORTS } from "../lib/filters";
import RecipeCard from "./recipecard";
import RecipeToolbar from "./recipetoolbar";
import "./recipemosaic.css";

const DEFAULTS = {
  query: "",
  sort: SORTS.name,
  maxMinutes: 0,
  noCook: false,
  momOnly: false,
};

// Filter state lives in the URL so a filtered view is shareable and the browser
// back button steps back through filters instead of leaving the page.
const readParams = (search) => {
  const params = new URLSearchParams(search);
  const sort = params.get("sort");
  return {
    query: params.get("q") || "",
    sort: Object.values(SORTS).includes(sort) ? sort : DEFAULTS.sort,
    maxMinutes: params.get("max") === "30" ? 30 : 0,
    noCook: params.get("nocook") === "1",
    momOnly: params.get("mom") === "1",
  };
};

const writeParams = (state) => {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.sort !== DEFAULTS.sort) params.set("sort", state.sort);
  if (state.maxMinutes) params.set("max", String(state.maxMinutes));
  if (state.noCook) params.set("nocook", "1");
  if (state.momOnly) params.set("mom", "1");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const CategoryPage = ({ english }) => {
  const { categoryId } = useParams();
  const location = useLocation();
  const history = useHistory();

  const [recipes, setRecipes] = useState([]);
  const [category, setCategory] = useState(
    // Use the category handed over by the click, if any, so the title paints
    // immediately; the fetch below still runs for direct visits.
    (location.state && location.state.categoryInContext) || null
  );
  const [status, setStatus] = useState("loading");

  const filters = useMemo(() => readParams(location.search), [location.search]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    Promise.all([fetchRecipesForCategory(categoryId), fetchCategories()])
      .then(([recipeList, categories]) => {
        if (cancelled) return;
        setRecipes(Array.isArray(recipeList) ? recipeList : []);
        const match = categories.find(
          (item) => String(item.CatID) === String(categoryId)
        );
        if (match) setCategory(match);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  const applyFilters = useCallback(
    (next) => {
      // replace() rather than push() while typing, so one search doesn't bury
      // the previous page under a dozen history entries.
      history.replace({
        pathname: location.pathname,
        search: writeParams(next),
        state: location.state,
      });
    },
    [history, location.pathname, location.state]
  );

  const visible = useMemo(
    () => filterRecipes(recipes, { ...filters, english }),
    [recipes, filters, english]
  );

  const title = category
    ? categoryName(category, english)
    : english
    ? "Recipes"
    : "Recetas";

  const copy = english
    ? {
        back: "All categories",
        loading: "Loading recipes…",
        error: "We couldn't load these recipes. Please try again.",
        empty: "No recipes match these filters.",
        emptyHint: "Try clearing a filter or searching for something else.",
        clear: "Clear all filters",
      }
    : {
        back: "Todas las categorías",
        loading: "Cargando recetas…",
        error: "No pudimos cargar estas recetas. Inténtalo de nuevo.",
        empty: "Ninguna receta coincide con estos filtros.",
        emptyHint: "Prueba quitando un filtro o buscando otra cosa.",
        clear: "Quitar todos los filtros",
      };

  return (
    <div className="category-page">
      <header className="category-hero">
        <div className="category-hero__inner">
          <Link className="category-hero__back" to="/#categories">
            <span aria-hidden="true">←</span> {copy.back}
          </Link>
          <h1 className="category-hero__title">{title}</h1>
          {status === "ready" && (
            <p className="category-hero__subtitle">
              {english
                ? `${recipes.length} ${
                    recipes.length === 1 ? "recipe" : "recipes"
                  } · tap one to open it`
                : `${recipes.length} ${
                    recipes.length === 1 ? "receta" : "recetas"
                  } · toca una para verla`}
            </p>
          )}
        </div>
      </header>

      {status === "ready" && recipes.length > 0 && (
        <RecipeToolbar
          english={english}
          value={filters}
          onChange={applyFilters}
          shown={visible.length}
          total={recipes.length}
          showClear={hasActiveFilters(filters)}
          onClear={() => applyFilters(DEFAULTS)}
        />
      )}

      <div className="category-body">
        {status === "loading" && (
          <p className="category-state" role="status">
            {copy.loading}
          </p>
        )}

        {status === "error" && (
          <p className="category-state category-state--error" role="alert">
            {copy.error}
          </p>
        )}

        {status === "ready" && visible.length === 0 && (
          <div className="category-state">
            <p className="category-state__title">{copy.empty}</p>
            <p className="category-state__hint">{copy.emptyHint}</p>
            <button
              type="button"
              className="category-state__button"
              onClick={() => applyFilters(DEFAULTS)}
            >
              {copy.clear}
            </button>
          </div>
        )}

        {status === "ready" && visible.length > 0 && (
          <ul className="recipe-grid">
            {visible.map((recipe) => (
              <li key={recipe.RowID}>
                <RecipeCard recipe={recipe} english={english} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
