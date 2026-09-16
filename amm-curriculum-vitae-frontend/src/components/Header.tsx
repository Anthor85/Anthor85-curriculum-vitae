import { NavLink } from 'react-router-dom';

import { useAuthStore } from '../hooks';
import { Button } from './Button';
import styles from './Header.module.scss';

const SECCIONES = [
  { to: '/experiencia', texto: 'Experiencia' },
  { to: '/conocimiento', texto: 'Conocimiento' },
  { to: '/formacion', texto: 'Formación' },
  { to: '/formacion-complementaria', texto: 'F. Complementaria' },
  { to: '/perfil', texto: 'Perfil' },
];

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className={styles.Header}>
      <nav className={styles.nav} aria-label="Secciones privadas">
        {SECCIONES.map(({ to, texto }) => (
          <NavLink
            key={to}
            to={to}
            // NavLink pasa el estado activo por función: así solo la sección
            // en la que estamos lleva la clase resaltada.
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activo}` : styles.link
            }
          >
            {texto}
          </NavLink>
        ))}
      </nav>

      <div className={styles.sesion}>
        {user?.nombre && <span className={styles.usuario}>{user.nombre}</span>}
        <Button name="Salir" onClick={logout} />
      </div>
    </header>
  );
};
