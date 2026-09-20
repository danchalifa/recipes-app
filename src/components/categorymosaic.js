import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../lib/api";
import { categoryName } from "../lib/format";
import "./categorymosaic.css";

// One banner per category, keyed by CatID. The tile keeps its gradient
// underneath, so a missing or failed image degrades to the old look rather
// than to an empty box.
const CategoryTileImage = ({ catId }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className="category-tile__image"
      src={`/category-images/${catId}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

const CategoryMosaic = ({ english }) => {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = english
    ? {
        title: "Categories",
        subtitle: "Pick a category, then sort or filter what's inside.",
        loading: "Loading categories…",
        error: "We couldn't load the categories. Please try again.",
        count: (n) => `${n} ${n === 1 ? "recipe" : "recipes"}`,
      }
    : {
        title: "Categorías",
        subtitle: "Elige una categoría y luego ordena o filtra las recetas.",
        loading: "Cargando categorías…",
        error: "No pudimos cargar las categorías. Inténtalo de nuevo.",
        count: (n) => `${n} ${n === 1 ? "receta" : "recetas"}`,
      };

  return (
    <section id="categories" className="categories">
      <div className="categories__inner">
        <h2 className="categories__title">{copy.title}</h2>
        <p className="categories__subtitle">{copy.subtitle}</p>

        {status === "loading" && (
          <p className="categories__state" role="status">
            {copy.loading}
          </p>
        )}

        {status === "error" && (
          <p className="categories__state" role="alert">
            {copy.error}
          </p>
        )}

        {status === "ready" && (
          <ul className="categories__grid">
            {categories.map((category, index) => (
              <li key={category.CatID}>
                {/* A real <Link> so each tile is keyboard focusable and can be
                    opened in a new tab; the old version was a div + push(). */}
                <Link
                  className={`category-tile category-tile--${index % 5}`}
                  to={`/category/${category.CatID}`}
                >
                  <CategoryTileImage catId={category.CatID} />
                  <span className="category-tile__name">
                    {categoryName(category, english)}
                  </span>
                  {typeof category.RecipeCount === "number" && (
                    <span className="category-tile__count">
                      {copy.count(category.RecipeCount)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CategoryMosaic;
