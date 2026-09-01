import { useEffect } from 'react';
import { usePerfilStore } from '../hooks';
import { PerfilForm } from './forms/PerfilForm';

import styles from './Layout.module.scss';

export const Perfil = () => {
  const { perfil, loading, error, getPerfil, guardarPerfil } = usePerfilStore();

  useEffect(() => {
    if (perfil === null) getPerfil();
  }, [getPerfil]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.form}>
        <h1>Editar Perfil</h1>
        <PerfilForm perfil={perfil} onSubmitPerfil={guardarPerfil} />
      </div>
    </div>
  );
};
