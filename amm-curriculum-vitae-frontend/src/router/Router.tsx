import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Curriculum } from '../pages/Curriculum';
import { useAuthStore } from '../hooks';
import { RutaPrivada } from './RutaPrivada';

// El login y las pantallas privadas van en chunks aparte: el visitante del CV nunca los carga
const Login = lazy(() =>
  import('../pages/Login').then((m) => ({ default: m.Login })),
);
const Experiencia = lazy(() =>
  import('../pages/Experiencia').then((m) => ({ default: m.Experiencia })),
);
const Conocimiento = lazy(() =>
  import('../pages/Conocimiento').then((m) => ({ default: m.Conocimiento })),
);
const Formacion = lazy(() =>
  import('../pages/Formacion').then((m) => ({ default: m.Formacion })),
);
const FormacionComplementaria = lazy(() =>
  import('../pages/FormacionComplementaria').then((m) => ({
    default: m.FormacionComplementaria,
  })),
);
const Perfil = lazy(() =>
  import('../pages/Perfil').then((m) => ({ default: m.Perfil })),
);

export const Router = () => {
  const { status, checkAuthToken } = useAuthStore();

  // Al arrancar se revalida el token guardado: hasta que responda, el status
  // es 'checking' y RutaPrivada no redirige a /login.
  useEffect(() => {
    checkAuthToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Curriculum />} />
        <Route
          path="/login"
          element={
            status === 'authenticated' ? (
              <Navigate to="/experiencia" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/experiencia"
          element={
            <RutaPrivada>
              <Experiencia />
            </RutaPrivada>
          }
        />
        <Route
          path="/conocimiento"
          element={
            <RutaPrivada>
              <Conocimiento />
            </RutaPrivada>
          }
        />
        <Route
          path="/formacion"
          element={
            <RutaPrivada>
              <Formacion />
            </RutaPrivada>
          }
        />
        <Route
          path="/formacion-complementaria"
          element={
            <RutaPrivada>
              <FormacionComplementaria />
            </RutaPrivada>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaPrivada>
              <Perfil />
            </RutaPrivada>
          }
        />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};
