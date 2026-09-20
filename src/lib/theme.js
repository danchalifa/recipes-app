import { useCallback, useEffect, useState } from "react";

// Theme preference. Stored as "light" or "dark"; absent means "follow the OS",
// which is what a visitor gets until they actually pick a side.
//
// localStorage rather than the cookie the language switch uses: the theme has
// to be applied by the inline script in public/index.html before React mounts,
// and reading one key there is simpler than parsing document.cookie.
export const THEME_KEY = "theme";

const THEME_COLORS = { light: "#ffffff", dark: "#1b1a22" };

// Returns null where matchMedia is missing (jsdom under the test runner, and
// any environment without the API); callers then just fall back to light.
const darkQuery = () =>
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

export const systemTheme = () => {
  const query = darkQuery();
  return query && query.matches ? "dark" : "light";
};

export const readStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch (error) {
    // Safari in private mode throws on any localStorage access.
    return null;
  }
};

const storeTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // Preference simply will not survive the session; not worth failing over.
  }
};

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);

  // Colours the browser chrome on mobile, which otherwise stays white and
  // leaves a bright bar above a dark page.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }
};

// Returns the active theme plus a toggle. The initial value matches whatever
// the inline script already put on <html>, so the first render never repaints.
export const useTheme = () => {
  const [theme, setTheme] = useState(() => readStoredTheme() || systemTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Keep following the OS while the visitor has made no explicit choice.
  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;

    const onChange = (event) => {
      if (readStoredTheme()) return;
      setTheme(event.matches ? "dark" : "light");
    };

    // addListener is the pre-Safari 14 spelling, still worth keeping for iOS.
    if (query.addEventListener) {
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  }, []);

  return [theme, toggleTheme];
};
