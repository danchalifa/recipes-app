import React from "react";
import { SORTS, SORT_LABELS } from "../lib/filters";
import "./recipetoolbar.css";

const COPY = {
  en: {
    search: "Search recipes in this category",
    placeholder: "Search by name…",
    sort: "Sort by",
    quick: "30 min or less",
    noCook: "No cooking",
    mom: "Mom's recipes",
    clear: "Clear",
    count: (shown, total) =>
      shown === total
        ? `${total} ${total === 1 ? "recipe" : "recipes"}`
        : `${shown} of ${total} recipes`,
  },
  es: {
    search: "Buscar recetas en esta categoría",
    placeholder: "Buscar por nombre…",
    sort: "Ordenar por",
    quick: "30 min o menos",
    noCook: "Sin cocción",
    mom: "Recetas de Mamá",
    clear: "Limpiar",
    count: (shown, total) =>
      shown === total
        ? `${total} ${total === 1 ? "receta" : "recetas"}`
        : `${shown} de ${total} recetas`,
  },
};

const RecipeToolbar = ({
  english,
  value,
  onChange,
  shown,
  total,
  showClear,
  onClear,
}) => {
  const t = english ? COPY.en : COPY.es;
  const labels = english ? SORT_LABELS.en : SORT_LABELS.es;

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="toolbar">
      <div className="toolbar__inner">
      <div className="toolbar__row">
        <div className="toolbar__search">
          <label className="visually-hidden" htmlFor="category-search">
            {t.search}
          </label>
          <svg
            className="toolbar__search-icon"
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
            id="category-search"
            className="toolbar__input"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder={t.placeholder}
            value={value.query}
            onChange={(event) => set({ query: event.target.value })}
          />
        </div>

        <div className="toolbar__sort">
          <label className="visually-hidden" htmlFor="category-sort">
            {t.sort}
          </label>
          <select
            id="category-sort"
            className="toolbar__select"
            value={value.sort}
            onChange={(event) => set({ sort: event.target.value })}
          >
            {Object.values(SORTS).map((key) => (
              <option key={key} value={key}>
                {labels[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="toolbar__row toolbar__row--chips">
        <div className="toolbar__chips">
          {/* aria-pressed makes the toggle state audible to screen readers. */}
          <button
            type="button"
            className="chip"
            aria-pressed={value.maxMinutes === 30}
            onClick={() =>
              set({ maxMinutes: value.maxMinutes === 30 ? 0 : 30 })
            }
          >
            {t.quick}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={value.noCook}
            onClick={() => set({ noCook: !value.noCook })}
          >
            {t.noCook}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={value.momOnly}
            onClick={() => set({ momOnly: !value.momOnly })}
          >
            {t.mom}
          </button>
        </div>

        <div className="toolbar__status">
          {/* aria-live announces the new count after each filter change. */}
          <span className="toolbar__count" aria-live="polite">
            {t.count(shown, total)}
          </span>
          {showClear && (
            <button type="button" className="toolbar__clear" onClick={onClear}>
              {t.clear}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default RecipeToolbar;
