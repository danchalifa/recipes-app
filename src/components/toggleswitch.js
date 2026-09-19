import React from "react";
import "./toggleswitch.css";

// Replaces @material-ui/core/Switch, which was the only Material-UI import left
// in the app. A native checkbox keeps the semantics (and the screen-reader
// behaviour) while dropping a large, unmaintained v4 dependency.
const ToggleSwitch = ({ toggleHandler, english }) => (
  <label className="lang-switch">
    <input
      className="lang-switch__input"
      type="checkbox"
      checked={Boolean(english)}
      onChange={(event) => toggleHandler(event.target.checked)}
    />
    <span className="lang-switch__track" aria-hidden="true">
      <span className="lang-switch__thumb" />
    </span>
    <span className="visually-hidden">
      {english ? "Show recipes in Spanish" : "Show recipes in English"}
    </span>
  </label>
);

export default ToggleSwitch;
