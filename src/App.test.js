import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import App from './App';

// App uses router hooks and the cookie context, so both providers are required
// for this smoke test the same way index.js supplies them in the real app.
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <CookiesProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </CookiesProvider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
