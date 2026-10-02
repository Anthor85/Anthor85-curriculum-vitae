/// <reference types="vite/client" />

// Currículum del build, escrito por scripts/prerender.mjs en dist/index.html
interface Window {
  __CURRICULUM__?: import('./interfaces/curriculum.interface').Curriculum;
}
