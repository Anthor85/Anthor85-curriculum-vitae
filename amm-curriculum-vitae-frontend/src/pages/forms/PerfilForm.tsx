import { useEffect, useState } from 'react';
import type { Perfil, PerfilPayload } from '../../interfaces/perfil.interface';

import styles from './Form.module.scss';

const PERFIL_VACIO: PerfilPayload = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  descripcion: '',
  foto: '',
};

interface Props {
  perfil: Perfil | null;
  onSubmitPerfil: (payload: PerfilPayload) => Promise<void> | void;
}

export const PerfilForm = ({ perfil, onSubmitPerfil }: Props) => {
  const [datosPerfil, setDatosPerfil] = useState<PerfilPayload>(PERFIL_VACIO);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!perfil) {
      setDatosPerfil(PERFIL_VACIO);
      return;
    }

    setDatosPerfil({
      ...perfil,
      fechaNacimiento: perfil.fechaNacimiento?.slice(0, 10) ?? '',
      foto: perfil.foto ?? '',
    });
  }, [perfil]);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: PerfilPayload = {
      ...datosPerfil,
      nombre: datosPerfil.nombre.trim(),
      apellidos: datosPerfil.apellidos.trim(),
      email: datosPerfil.email.trim(),
      telefono: datosPerfil.telefono.trim(),
      direccion: datosPerfil.direccion.trim(),
      descripcion: datosPerfil.descripcion.trim(),
      foto: datosPerfil.foto.trim(),
    };

    setIsPending(true);
    try {
      await onSubmitPerfil(payload);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={datosPerfil.nombre}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, nombre: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="apellidos">Apellidos:</label>
        <input
          type="text"
          id="apellidos"
          name="apellidos"
          value={datosPerfil.apellidos}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, apellidos: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email:</label>
        <input
          type="text"
          id="email"
          name="email"
          value={datosPerfil.email}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, email: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="telefono">Teléfono:</label>
        <input
          type="text"
          id="telefono"
          name="telefono"
          value={datosPerfil.telefono}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, telefono: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="direccion">Dirección:</label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={datosPerfil.direccion}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, direccion: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaNacimiento">Fecha de Nacimiento:</label>
        <input
          type="date"
          id="fechaNacimiento"
          name="fechaNacimiento"
          value={datosPerfil.fechaNacimiento}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, fechaNacimiento: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="descripcion">Descripción:</label>
        <input
          type="text"
          id="descripcion"
          name="descripcion"
          value={datosPerfil.descripcion}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, descripcion: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="foto">Foto:</label>
        <input
          type="text"
          id="foto"
          name="foto"
          value={datosPerfil.foto}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, foto: e.target.value })
          }
        />
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={isPending}>
          {perfil
            ? isPending
              ? 'Actualizando...'
              : 'Actualizar Perfil'
            : isPending
              ? 'Creando...'
              : 'Crear Perfil'}
        </button>
      </div>
    </form>
  );
};
