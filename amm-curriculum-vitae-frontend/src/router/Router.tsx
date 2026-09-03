import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  MainPage,
  Experiencia,
  Formacion,
  FormacionComplementaria,
  Conocimiento,
  Perfil,
  Login,
} from '../pages';
import { useAuthStore } from '../hooks';
import { RutaPrivada } from './RutaPrivada';

export const Router = () => {
  const { status, checkAuthToken } = useAuthStore();

  // Al arrancar se revalida el token guardado: hasta que responda, el status
  // es 'checking' y RutaPrivada no redirige a /login.
  useEffect(() => {
    checkAuthToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
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
  );
};
