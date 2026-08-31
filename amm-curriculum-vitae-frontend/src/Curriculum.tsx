// import React from 'react';

import { BrowserRouter /* , Route  */ } from 'react-router-dom';

import { Router } from './router/Router';
// import { getEnvVariables } from "./helpers/getEnvVariables";
import { Provider } from 'react-redux';
import { store } from './store';

function Curriculum() {
  // const { VITE_BASE_URL: baseUrl } = getEnvVariables();

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </Provider>
  );
}

export default Curriculum;
