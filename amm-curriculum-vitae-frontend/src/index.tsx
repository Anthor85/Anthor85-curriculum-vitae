import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import Curriculum from './Curriculum';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Curriculum />
  </React.StrictMode>,
);
