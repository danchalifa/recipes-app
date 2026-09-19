import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './theme.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from "react-cookie";

function Root() {
  return (
    <CookiesProvider>
      <App />
    </CookiesProvider>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>,
  document.getElementById("root")
);
registerServiceWorker();

export default Root;
