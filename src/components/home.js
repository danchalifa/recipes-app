import React from "react";
import Banner from "./banner.js";
import CategoryMosaic from "./categorymosaic.js";
import FeaturedRecipes from "./featuredrecipies.js";
import HomeSearch from "./homesearch.js";
import "./home.css";

const Home = ({ english }) => (
  <div id="Home" className="home">
    <Banner />
    <HomeSearch english={english} />
    <CategoryMosaic english={english} />
    <FeaturedRecipes english={english} />
  </div>
);

export default Home;
