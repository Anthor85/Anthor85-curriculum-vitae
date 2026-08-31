import { useEffect } from 'react';
import { usePerfilStore } from '../hooks';
import { PerfilForm } from './forms/PerfilForm';

import styles from './Layout.module.scss';

export const Perfil = () => {
  const {
    perfil,
    loading,
    error,
    getPerfil,
    createPerfil,
    deletePerfil, //TODO: cambiar deletePerfil por updatePerfil
  } = usePerfilStore();

  useEffect(() => {
    if (perfil === null) getPerfil();
  }, [getPerfil]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.form}>
        <h1>Crear Perfil</h1>
        <PerfilForm onAddPerfil={createPerfil} />
      </div>
    </div>
  );
};
