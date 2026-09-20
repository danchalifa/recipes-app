import React, { Component, useEffect } from "react";
import { Route, Switch, useLocation } from "react-router-dom";
import { instanceOf } from "prop-types";
import { withCookies, Cookies } from "react-cookie";

// Resolve through node_modules rather than a relative path: CRA 5 refuses
// imports that reach outside src/, which broke the production build.
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import Home from "./components/home.js";
import About from "./components/about.js";
import Navbar from "./components/navbar.js";
import CategoryPage from "./components/recipemosaic.js";
import RecipePage from "./components/recipe.js";
import SearchPage from "./components/search.js";
import Footer from "./components/footer.js";

// Replaces the history.listen() call that used to run inside a render function
// in featuredrecipies.js, which registered a new listener on every render.
const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
  };

  constructor(props) {
    super(props);
    const { cookies } = props;
    this.state = { english: cookies.get("english") === "true" };
  }

  toggleHandler = (checked) => {
    const { cookies } = this.props;
    cookies.set("english", checked ? "true" : "false", { path: "/" });
    this.setState({ english: Boolean(checked) });
  };

  render() {
    const { english } = this.state;

    return (
      <main>
        <Navbar toggleHandler={this.toggleHandler} english={english} />
        <ScrollManager />
        <Switch>
          <Route
            path="/"
            exact
            render={(props) => <Home {...props} english={english} />}
          />
          <Route
            path="/about"
            render={(props) => <About {...props} english={english} />}
          />
          <Route
            path="/search"
            render={(props) => <SearchPage {...props} english={english} />}
          />
          <Route
            path="/category/:categoryId"
            render={(props) => <CategoryPage {...props} english={english} />}
          />
          {/* Canonical recipe URL: the numeric id disambiguates the two pairs of
              recipes that share a name, the slug keeps the link readable. */}
          <Route
            path="/recipe/:recipeId(\d+)/:slug?"
            render={(props) => <RecipePage {...props} english={english} />}
          />
          {/* Legacy shape (/recipe/Enchiladas%20Verdes) resolved by name. */}
          <Route
            path="/recipe/:slug"
            render={(props) => <RecipePage {...props} english={english} />}
          />
        </Switch>
        <Footer english={english} />
      </main>
    );
  }
}

export default withCookies(App);
