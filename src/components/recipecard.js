import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  formatMinutes,
  minutes,
  recipeName,
  recipePath,
  swatchIndex,
  totalMinutes,
} from "../lib/format";
import "./recipecard.css";

// A real <Link> rather than a div + history.push: middle-click, "open in new
// tab" and screen readers all work, and the whole card is one large tap target.
const RecipeCard = ({ recipe, english, showCategory }) => {
  const prep = minutes(recipe.Prep_Time);
  const cook = minutes(recipe.Cook_Time);
  const total = totalMinutes(recipe);

  // The coloured swatch stays underneath as the fallback: if a recipe has no
  // image, or it fails to load, the card still looks deliberate.
  const [artFailed, setArtFailed] = useState(false);

  return (
    <Link className="recipe-card" to={recipePath(recipe)}>
      <div className={`recipe-card__art swatch-${swatchIndex(recipe)}`}>
        {!artFailed && (
          <img
            className="recipe-card__image"
            src={`/recipe-images/${recipe.RowID}.webp`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setArtFailed(true)}
          />
        )}
        {total > 0 && total <= 30 && (
          <span className="recipe-card__flag">
            {english ? "Quick" : "Rápida"}
          </span>
        )}
      </div>
      <div className="recipe-card__body">
        {showCategory && (
          <p className="recipe-card__eyebrow">
            {(english ? recipe.Type_English : recipe.Type) || ""}
          </p>
        )}
        <h3 className="recipe-card__title">{recipeName(recipe, english)}</h3>
        <ul className="recipe-card__meta">
          <li>
            <span className="recipe-card__meta-label">
              {english ? "Prep" : "Prep"}
            </span>
            {formatMinutes(prep, english)}
          </li>
          <li>
            <span className="recipe-card__meta-label">
              {english ? "Cook" : "Cocción"}
            </span>
            {formatMinutes(cook, english)}
          </li>
        </ul>
      </div>
    </Link>
  );
};

export default RecipeCard;
