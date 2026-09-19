import React from "react";
import "./footer.css";

const Footer = ({ english }) => (
  <footer className="footer">
    <p className="footer__text">
      {english
        ? "Copyright © 2026 Dan Chalifa · Michael Gardner · Las Recetas de Mamá · All rights reserved"
        : "Copyright © 2026 Dan Chalifa · Michael Gardner · Las Recetas de Mamá · Todos los derechos reservados"}
    </p>
  </footer>
);

export default Footer;
