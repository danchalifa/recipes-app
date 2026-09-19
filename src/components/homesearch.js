import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import "./homesearch.css";

// Puts search on the landing page rather than burying it in the nav, which is
// where a phone user looks first.
const HomeSearch = ({ english }) => {
  const history = useHistory();
  const [term, setTerm] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    history.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const copy = english
    ? {
        label: "Search recipes",
        placeholder: "Search 289 recipes by name or ingredient…",
        button: "Search",
        hint: "Try “pollo”, “chocolate” or “almendras”.",
      }
    : {
        label: "Buscar recetas",
        placeholder: "Busca 289 recetas por nombre o ingrediente…",
        button: "Buscar",
        hint: "Prueba «pollo», «chocolate» o «almendras».",
      };

  return (
    <section className="home-search">
      <form className="home-search__form" onSubmit={onSubmit} role="search">
        <label className="visually-hidden" htmlFor="home-search-input">
          {copy.label}
        </label>
        <input
          id="home-search-input"
          className="home-search__input"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder={copy.placeholder}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <button className="home-search__button" type="submit">
          {copy.button}
        </button>
      </form>
      <p className="home-search__hint">{copy.hint}</p>
    </section>
  );
};

export default HomeSearch;
