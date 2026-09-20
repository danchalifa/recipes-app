import React, { Component, Suspense, lazy, useEffect } from "react";
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

// Split into its own chunk: the admin tool is used by one person and has no
// business adding weight to the bundle every visitor downloads.
const AdminPage = lazy(() => import("./components/admin.js"));

const isAdminPath = (pathname) =>
  String(pathname || "").toLowerCase().startsWith("/admin");

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

// The admin tool stands on its own: the language toggle and the recipe nav are
// noise there, and keeping the chrome off makes it obvious it is not part of
// the public site.
const Chrome = ({ children }) => {
  const { pathname } = useLocation();
  return isAdminPath(pathname) ? null : children;
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
        <Chrome>
          <Navbar toggleHandler={this.toggleHandler} english={english} />
        </Chrome>
        <ScrollManager />
        <Switch>
          {/* Intentionally absent from the nav, the footer and every link on the
              site. Obscurity is not the protection though -- /api/admin checks
              the password server side on every request. */}
          <Route
            path="/admin"
            render={() => (
              <Suspense fallback={<p className="admin-state">Loading…</p>}>
                <AdminPage />
              </Suspense>
            )}
          />
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
        <Chrome>
          <Footer english={english} />
        </Chrome>
      </main>
    );
  }
}

export default withCookies(App);
