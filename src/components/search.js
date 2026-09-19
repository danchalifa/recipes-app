import React, { useEffect, useMemo, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { fetchSearchIndex } from "../lib/api";
import { filterRecipes, SORTS } from "../lib/filters";
import RecipeCard from "./recipecard";
import "./search.css";

const SearchPage = ({ english }) => {
  const location = useLocation();
  const history = useHistory();

  const query = useMemo(
    () => new URLSearchParams(location.search).get("q") || "",
    [location.search]
  );

  // Local draft so typing stays instant; the URL is updated on a short debounce.
  const [draft, setDraft] = useState(query);
  const [index, setIndex] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    fetchSearchIndex()
      .then((data) => {
        if (cancelled) return;
        setIndex(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (draft === query) return undefined;
    const timer = setTimeout(() => {
      history.replace(draft ? `/search?q=${encodeURIComponent(draft)}` : "/search");
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, query, history]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return filterRecipes(index, {
      query,
      sort: SORTS.name,
      english,
      // Global search reaches into ingredients, so "anchovy" finds the
      // Caesar dressing even though the word isn't in any title.
      searchIngredients: true,
    });
  }, [index, query, english]);

  const grouped = useMemo(() => {
    const buckets = new Map();
    results.forEach((recipe) => {
      const label =
        (english ? recipe.Type_English : recipe.Type) ||
        (english ? "Other" : "Otras");
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(recipe);
    });
    return Array.from(buckets.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], english ? "en" : "es")
    );
  }, [results, english]);

  const copy = english
    ? {
        title: "Search recipes",
        placeholder: "Search all recipes and ingredients…",
        label: "Search all recipes",
        loading: "Loading recipes…",
        error: "Search is unavailable right now. Please try again.",
        prompt: "Type to search all 289 recipes by name or ingredient.",
        none: (q) => `No recipes match “${q}”.`,
        noneHint: "Check the spelling, or try a single ingredient.",
        count: (n) => `${n} ${n === 1 ? "result" : "results"}`,
        browse: "Browse categories instead",
      }
    : {
        title: "Buscar recetas",
        placeholder: "Busca en todas las recetas e ingredientes…",
        label: "Buscar en todas las recetas",
        loading: "Cargando recetas…",
        error: "La búsqueda no está disponible. Inténtalo de nuevo.",
        prompt:
          "Escribe para buscar las 289 recetas por nombre o ingrediente.",
        none: (q) => `Ninguna receta coincide con «${q}».`,
        noneHint: "Revisa la ortografía o prueba con un solo ingrediente.",
        count: (n) => `${n} ${n === 1 ? "resultado" : "resultados"}`,
        browse: "Ver las categorías",
      };

  return (
    <div className="search-page">
      <div className="search-page__inner">
        <h1 className="search-page__title">{copy.title}</h1>

        <div className="search-page__field">
          <label className="visually-hidden" htmlFor="global-search">
            {copy.label}
          </label>
          <svg
            className="search-page__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M10.5 3a7.5 7.5 0 105.29 12.79l4.21 4.21 1.41-1.41-4.21-4.21A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
              fill="currentColor"
            />
          </svg>
          <input
            id="global-search"
            className="search-page__input"
            type="search"
            inputMode="search"
            autoComplete="off"
            // Focus only when arriving with an empty box, so following a
            // navbar search doesn't pop the mobile keyboard over the results.
            autoFocus={!query}
            placeholder={copy.placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>

        {status === "loading" && (
          <p className="search-state" role="status">
            {copy.loading}
          </p>
        )}

        {status === "error" && (
          <p className="search-state search-state--error" role="alert">
            {copy.error}
          </p>
        )}

        {status === "ready" && !query.trim() && (
          <p className="search-state">{copy.prompt}</p>
        )}

        {status === "ready" && query.trim() && results.length === 0 && (
          <div className="search-state">
            <p className="search-state__title">{copy.none(query)}</p>
            <p>{copy.noneHint}</p>
            <Link className="search-state__link" to="/#categories">
              {copy.browse}
            </Link>
          </div>
        )}

        {status === "ready" && results.length > 0 && (
          <>
            <p className="search-page__count" aria-live="polite">
              {copy.count(results.length)}
            </p>
            {grouped.map(([label, items]) => (
              <section className="search-group" key={label}>
                <h2 className="search-group__title">
                  {label}
                  <span className="search-group__count">{items.length}</span>
                </h2>
                <ul className="recipe-grid">
                  {items.map((recipe) => (
                    <li key={recipe.RowID}>
                      <RecipeCard recipe={recipe} english={english} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
