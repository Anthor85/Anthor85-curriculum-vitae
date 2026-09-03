import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../hooks';

interface Props {
  children: ReactNode;
}

export const RutaPrivada = ({ children }: Props) => {
  const { status } = useAuthStore();
  const location = useLocation();

  // Mientras se revalida el token no se pinta nada: sin este estado la pagina
  // parpadearia a /login antes de saber si hay sesion.
  if (status === 'checking') return <p>Loading...</p>;

  if (status === 'not-authenticated')
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return <>{children}</>;
};
