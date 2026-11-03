import 'i18next';
import type es from './locales/es.json';

// Las claves se comprueban contra es.json: una clave que falte no compila.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof es };
  }
}
