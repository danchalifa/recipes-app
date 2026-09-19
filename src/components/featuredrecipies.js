import React from "react";
import { Link } from "react-router-dom";
import "./featuredrecipes.css";

import RecipeOne from "../images/featuredRecipes/recipe1.jpg";
import RecipeTwo from "../images/featuredRecipes/recipe2.jpg";
import RecipeThree from "../images/featuredRecipes/recipe3.jpg";

// These used to carry a full copy of each recipe in router state, which meant
// the featured cards and data/recipes.json could silently drift apart and the
// resulting page died on refresh. Link to the canonical record instead.
const FEATURED = [
  {
    id: 150,
    slug: "enchiladas-verdes",
    image: RecipeOne,
    alt: "Enchiladas",
    en: {
      title: "Green Enchiladas",
      text: "Classic Swiss enchiladas with melted mozzarella, sour cream, red onion and homestyle salsa verde.",
      note: "Ready in less than one hour",
    },
    es: {
      title: "Enchiladas Verdes",
      text: "Enchiladas suizas con queso gratinado, crema, cebolla morada y salsa verde casera.",
      note: "Listas en menos de una hora",
    },
  },
  {
    id: 170,
    slug: "tamales",
    image: RecipeTwo,
    alt: "Tamales",
    en: {
      title: "Tamales",
      text: "Homestyle tamales. Pair with refried beans and a homestyle salsa verde.",
      note: "Four hours of work, very much worth the effort",
    },
    es: {
      title: "Tamales",
      text: "Tamales caseros. Combinan perfecto con frijoles refritos y salsa verde casera.",
      note: "4 horas de trabajo pero valen mucho la pena",
    },
  },
  {
    id: 267,
    slug: "flan-de-almendras",
    image: RecipeThree,
    alt: "Flan de Almendras",
    en: {
      title: "Almond Flan",
      text: "Silky almond flan baked in a water bath and glazed with burnt-sugar caramel.",
      note: "Fifteen minutes of prep, an hour in the oven",
    },
    es: {
      title: "Flan de Almendras",
      text: "Flan de almendras horneado a baño maría y glaseado con caramelo de azúcar quemada.",
      note: "15 minutos de preparación y una hora al horno",
    },
  },
];

const FeaturedRecipes = ({ english }) => {
  const heading = english ? "Featured Recipes" : "Recetas Destacadas";
  const cta = english ? "See recipe" : "Ver receta";

  return (
    <section className="featured">
      <div className="featured__inner">
        <h2 className="featured__title">{heading}</h2>
        <ul className="featured__grid">
          {FEATURED.map((item) => {
            const copy = english ? item.en : item.es;
            return (
              <li className="featured__item" key={item.id}>
                <Link
                  className="featured__card"
                  to={`/recipe/${item.id}/${item.slug}`}
                >
                  <img
                    className="featured__image"
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                  />
                  <div className="featured__body">
                    <h3 className="featured__card-title">{copy.title}</h3>
                    <p className="featured__text">{copy.text}</p>
                    <p className="featured__note">{copy.note}</p>
                    <span className="featured__cta">{cta}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default FeaturedRecipes;
