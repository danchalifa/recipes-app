import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeBySlug } from "../lib/api";
import { formatMinutes, recipeName, totalMinutes } from "../lib/format";
import "./recipe.css";

// Ingredient/direction bodies are stored as HTML with <br> separators. They are
// author-controlled data, but strip anything executable before injecting it.
const sanitize = (html) =>
  String(html == null ? "" : html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/ on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

// The same card art, reused as a thumbnail in the hero. The box is laid out
// immediately and the image fades in once decoded, so the title never jumps;
// a recipe with no image drops the box entirely and the hero reads as text.
const RecipeHeroImage = ({ recipe }) => {
  const [state, setState] = useState("loading");
  if (!recipe || !recipe.RowID || state === "failed") return null;
  return (
    <div className={`recipe-hero__figure recipe-hero__figure--${state}`}>
      <img
        className="recipe-hero__image"
        src={`/recipe-images/${recipe.RowID}.webp`}
        alt=""
        decoding="async"
        onLoad={() => setState("ready")}
        onError={() => setState("failed")}
      />
    </div>
  );
};

const RecipePage = ({ english, location }) => {
  const { recipeId, slug } = useParams();

  // Seed from router state when the user clicked through, so the page paints
  // instantly; otherwise (refresh, shared link, bookmark) we fetch it.
  const seeded = (location && location.state && location.state.recipe) || null;
  // Held in a ref so the fetch effect can read it without treating a brand new
  // location object on every render as a reason to refetch.
  const seededRef = useRef(seeded);
  seededRef.current = seeded;

  const [recipe, setRecipe] = useState(seeded);
  const [status, setStatus] = useState(seeded ? "ready" : "loading");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipeId, slug]);

  useEffect(() => {
    const fromRouter = seededRef.current;
    if (fromRouter && String(fromRouter.RowID) === String(recipeId)) {
      setRecipe(fromRouter);
      setStatus("ready");
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");

    // Legacy links look like /recipe/Enchiladas%20Verdes with no numeric id.
    const request = recipeId ? fetchRecipe(recipeId) : fetchRecipeBySlug(slug);

    request
      .then((found) => {
        if (cancelled) return;
        setRecipe(found);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [recipeId, slug]);

  const copy = english
    ? {
        loading: "Loading recipe…",
        error: "We couldn't find that recipe.",
        back: "Back to all categories",
        prep: "Prep time",
        cook: "Cook time",
        total: "Total",
        ingredients: "Ingredients",
        directions: "Directions",
      }
    : {
        loading: "Cargando receta…",
        error: "No encontramos esa receta.",
        back: "Volver a las categorías",
        prep: "Tiempo de preparación",
        cook: "Tiempo de cocción",
        total: "Total",
        ingredients: "Ingredientes",
        directions: "Direcciones",
      };

  if (status === "loading") {
    return (
      <div className="recipe-page">
        <p className="recipe-state" role="status">
          {copy.loading}
        </p>
      </div>
    );
  }

  if (status === "error" || !recipe) {
    return (
      <div className="recipe-page">
        <div className="recipe-state" role="alert">
          <p className="recipe-state__title">{copy.error}</p>
          <Link className="recipe-state__button" to="/#categories">
            {copy.back}
          </Link>
        </div>
      </div>
    );
  }

  const ingredients = english
    ? recipe.Ingredients_English
    : recipe.Ingredientes;
  const directions = english ? recipe.Directions_English : recipe.Direcciones;
  const categoryLabel = english ? recipe.Type_English : recipe.Type;

  return (
    <article className="recipe-page">
      <header className="recipe-hero">
        <div className="recipe-hero__inner">
          <div className="recipe-hero__text">
            {recipe.CatID && (
              <Link
                className="recipe-hero__back"
                to={`/category/${recipe.CatID}`}
              >
                <span aria-hidden="true">←</span>{" "}
                {categoryLabel || (english ? "Recipes" : "Recetas")}
              </Link>
            )}
            <h1 className="recipe-hero__title">
              {recipeName(recipe, english)}
            </h1>
            <dl className="recipe-hero__times">
              <div>
                <dt>{copy.prep}</dt>
                <dd>{formatMinutes(recipe.Prep_Time, english)}</dd>
              </div>
              <div>
                <dt>{copy.cook}</dt>
                <dd>{formatMinutes(recipe.Cook_Time, english)}</dd>
              </div>
              <div>
                <dt>{copy.total}</dt>
                <dd>{formatMinutes(totalMinutes(recipe), english)}</dd>
              </div>
            </dl>
          </div>
          <RecipeHeroImage recipe={recipe} />
        </div>
      </header>

      <div className="recipe-body">
        <section className="recipe-section">
          <h2 className="recipe-section__title">{copy.ingredients}</h2>
          <div
            className="recipe-section__text"
            dangerouslySetInnerHTML={{ __html: sanitize(ingredients) }}
          />
        </section>

        <section className="recipe-section">
          <h2 className="recipe-section__title">{copy.directions}</h2>
          <div
            className="recipe-section__text"
            dangerouslySetInnerHTML={{ __html: sanitize(directions) }}
          />
        </section>
      </div>
    </article>
  );
};

export default RecipePage;
