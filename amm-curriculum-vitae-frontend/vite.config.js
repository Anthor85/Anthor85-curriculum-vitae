import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['test/**/*.test.tsx'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/pages/Login.tsx',
        'src/pages/Perfil.tsx',
        'src/pages/Conocimiento.tsx',
        'src/pages/Experiencia.tsx',
        'src/pages/Formacion.tsx',
        'src/pages/FormacionComplementaria.tsx',
        'src/pages/forms/PerfilForm.tsx',
        'src/pages/forms/ConocimientoForm.tsx',
        'src/pages/forms/ExperienciaForm.tsx',
        'src/pages/forms/FormacionForm.tsx',
        'src/pages/forms/FormacionComplementariaForm.tsx',
        'src/pages/cards/ConocimientoCard.tsx',
        'src/pages/cards/ExperienciaCard.tsx',
        'src/pages/cards/FormacionCard.tsx',
        'src/pages/cards/FormacionComplementariaCard.tsx',
        'src/components/Button.tsx',
        'src/components/MensajeAccion.tsx',
        'src/components/MultiSelect.tsx',
        'src/components/Tabs.tsx',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
