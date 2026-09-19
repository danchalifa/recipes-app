import React from "react";
import { useTheme } from "../lib/theme.js";
import "./themetoggle.css";

// An icon button rather than a second pill switch: the navbar already carries
// the language switch and its label, and a sun/moon needs no label of its own.
const ThemeToggle = ({ english }) => {
  const [theme, toggleTheme] = useTheme();
  const dark = theme === "dark";

  const label = english
    ? dark
      ? "Switch to light theme"
      : "Switch to dark theme"
    : dark
    ? "Cambiar al tema claro"
    : "Cambiar al tema oscuro";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={label}
      title={label}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {/* Sun: click to go back to the light theme. */}
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2" />
            <path d="M6.05 6.05L4.5 4.5M19.5 19.5l-1.55-1.55M17.95 6.05L19.5 4.5M4.5 19.5l1.55-1.55" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {/* Moon: click to go dark. */}
          <path
            d="M20.2 14.6A8.4 8.4 0 019.4 3.8a8.4 8.4 0 1010.8 10.8z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
