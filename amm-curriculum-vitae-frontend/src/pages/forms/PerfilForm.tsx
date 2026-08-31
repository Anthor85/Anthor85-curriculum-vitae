import { useActionState, useEffect, useState } from 'react';
import { Perfil } from '../../interfaces/perfil.interface';

import styles from './Form.module.scss';

interface Props {
  onAddPerfil: Perfil;
}

export const PerfilForm = ({ onAddPerfil }: Props) => {
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, queryData: FormData) => onAddPerfil(queryData),
    null,
  );

  return (
    <form action={formAction} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="nombre">Nombre:</label>
        <input type="text" id="nombre" name="nombre" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="apellidos">Apellidos:</label>
        <input type="text" id="apellidos" name="apellidos" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email:</label>
        <input type="text" id="email" name="email" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="telefono">Teléfono:</label>
        <input type="text" id="telefono" name="telefono" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="direccion">Dirección:</label>
        <input type="text" id="direccion" name="direccion" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaNacimiento">Fecha de Nacimiento:</label>
        <input
          type="date"
          id="fechaNacimiento"
          name="fechaNacimiento"
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="descripcion">Descripción:</label>
        <input type="text" id="descripcion" name="descripcion" />
      </div>
      <div className={styles.field}>
        <label htmlFor="foto">Foto:</label>
        <input type="text" id="foto" name="foto" />
      </div>
      <button type="submit">Agregar Datos de Perfil</button>
    </form>
  );
};
