import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Header } from '../components/Header';
import { useAuthStore } from '../hooks';
import { Spinner } from '../components/Spinner';

interface Props {
  children: ReactNode;
}

export const RutaPrivada = ({ children }: Props) => {
  const { status } = useAuthStore();
  const location = useLocation();

  // Mientras se revalida el token no se pinta nada: sin este estado la pagina
  // parpadearia a /login antes de saber si hay sesion.
  if (status === 'checking') return <Spinner />;

  if (status === 'not-authenticated')
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // El header vive aqui y no en cada pagina: toda ruta privada lo hereda.
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
};
