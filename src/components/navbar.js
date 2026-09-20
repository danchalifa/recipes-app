import React, { useEffect, useState } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import ToggleSwitch from "./toggleswitch.js";
import ThemeToggle from "./themetoggle.js";
import "./navbar.css";

const SiteNavbar = ({ toggleHandler, english }) => {
  const history = useHistory();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState("");

  // Collapse the mobile menu whenever navigation happens, otherwise the open
  // panel covers the page the user just asked for.
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname, location.search]);

  const go = (path) => (event) => {
    event.preventDefault();
    setExpanded(false);
    history.push(path);
  };

  const onSearch = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    setExpanded(false);
    history.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const copy = english
    ? {
        home: "Home",
        categories: "Categories",
        about: "About",
        search: "Search",
        placeholder: "Search recipes…",
        brand: "Mom's Recipes",
      }
    : {
        home: "Inicio",
        categories: "Categorías",
        about: "Acerca de",
        search: "Buscar",
        placeholder: "Buscar recetas…",
        brand: "Las Recetas de Mamá",
      };

  return (
    <Navbar
      bg="light"
      expand="lg"
      fixed="top"
      className="site-nav"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Navbar.Brand className="site-nav__brand" href="/" onClick={go("/")}>
        {copy.brand}
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="main-nav" className="site-nav__toggle" />

      <Navbar.Collapse id="main-nav">
        <Nav className="mr-auto site-nav__links">
          <Nav.Link className="nav-links" href="/" onClick={go("/")}>
            {copy.home}
          </Nav.Link>
          <Nav.Link className="nav-links" href="/#categories">
            {copy.categories}
          </Nav.Link>
          <Nav.Link className="nav-links" href="/about" onClick={go("/about")}>
            {copy.about}
          </Nav.Link>
        </Nav>

        <form className="site-nav__search" onSubmit={onSearch} role="search">
          <label className="visually-hidden" htmlFor="nav-search">
            {copy.search}
          </label>
          <input
            id="nav-search"
            className="site-nav__search-input"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder={copy.placeholder}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
          <button
            className="site-nav__search-button"
            type="submit"
            aria-label={copy.search}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M10.5 3a7.5 7.5 0 105.29 12.79l4.21 4.21 1.41-1.41-4.21-4.21A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>

        <div className="site-nav__prefs">
          <ThemeToggle english={english} />
          <div className="site-nav__lang">
            <ToggleSwitch toggleHandler={toggleHandler} english={english} />
            <span className="site-nav__lang-label">English</span>
          </div>
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default SiteNavbar;
