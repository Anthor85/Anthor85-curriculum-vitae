import { useEffect } from 'react';
import { useMensajeAccion, usePerfilStore } from '../hooks';
import { PerfilForm } from './forms/PerfilForm';
import type { PerfilPayload } from '../interfaces/perfil.interface';

import styles from './Layout.module.scss';

export const Perfil = () => {
  const { perfil, loading, getPerfil, guardarPerfil } = usePerfilStore();

  const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

  const enviarPerfil = async (payload: PerfilPayload) => {
    const esNuevo = !perfil?.id;

    const guardado = await guardarPerfil(payload);
    if (!guardado) return mostrarError();

    mostrarMensaje(esNuevo ? 'Perfil creado' : 'Perfil actualizado');
  };

  useEffect(() => {
    if (perfil === null)
      getPerfil().then((obtenido) => {
        if (!obtenido) mostrarError();
      });
  }, [perfil, getPerfil, mostrarError]);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.form}>
        <h1>Editar Perfil</h1>
        <PerfilForm
          key={perfil?.id ?? 'nuevo'}
          perfil={perfil}
          onSubmitPerfil={enviarPerfil}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
