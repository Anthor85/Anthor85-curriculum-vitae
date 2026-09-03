import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { MensajeAccion } from '../components/MensajeAccion';
import { useAuthStore, useMensajeAccion } from '../hooks';

import styles from './Login.module.scss';

const RUTA_POR_DEFECTO = '/experiencia';

export const Login = () => {
  const { startLogin } = useAuthStore();
  const { mensaje, mostrarMensaje } = useMensajeAccion();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsPending(true);
    try {
      const { ok, errorMessage } = await startLogin({ email, password });

      if (!ok) return mostrarMensaje(errorMessage!);

      // El guard guarda en `state.from` la ruta privada que se pidio; sin ella
      // se ha entrado directamente por /login.
      const destino =
        (location.state as { from?: string } | null)?.from ?? RUTA_POR_DEFECTO;

      navigate(destino, { replace: true });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.Login}>
      <div className={styles.card}>
        <h1>Acceso</h1>
        <form onSubmit={enviar}>
          <div className={styles.field}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button name="Entrar" type="submit" disabled={isPending} />
        </form>
        <MensajeAccion mensaje={mensaje} />
      </div>
    </div>
  );
};
