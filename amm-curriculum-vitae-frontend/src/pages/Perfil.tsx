import { useEffect } from 'react';
import { useMensajeAccion, usePerfilStore } from '../hooks';
import { PerfilForm } from './forms/PerfilForm';
import type { PerfilPayload } from '../interfaces/perfil.interface';

import styles from './Layout.module.scss';

export const Perfil = () => {
  const { perfil, loading, error, getPerfil, guardarPerfil } = usePerfilStore();

  const { mensaje, mostrarMensaje } = useMensajeAccion();

  const enviarPerfil = async (payload: PerfilPayload) => {
    const esNuevo = !perfil?.id;

    const guardado = await guardarPerfil(payload);
    if (guardado)
      mostrarMensaje(esNuevo ? 'Perfil creado' : 'Perfil actualizado');
  };

  useEffect(() => {
    if (perfil === null) getPerfil();
  }, [getPerfil]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.form}>
        <h1>Editar Perfil</h1>
        <PerfilForm
          perfil={perfil}
          onSubmitPerfil={enviarPerfil}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
