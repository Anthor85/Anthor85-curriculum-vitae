import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import type { Perfil, PerfilPayload } from '../../interfaces/perfil.interface';

import { Button } from '../../components/Button';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const PERFIL_VACIO: PerfilPayload = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  descripcion: '',
  foto: '',
  linkedinURL: '',
  githubURL: '',
  disponibilidad: '',
  idiomas: [],
};

interface Props {
  perfil: Perfil | null;
  onSubmitPerfil: (payload: PerfilPayload) => Promise<void> | void;
  mensaje: MensajeAccionType | null;
}

export const PerfilForm = ({ perfil, onSubmitPerfil, mensaje }: Props) => {
  // El padre remonta el form con `key` al cambiar el perfil.
  const [datosPerfil, setDatosPerfil] = useState<PerfilPayload>(() =>
    perfil
      ? {
          ...perfil,
          foto: perfil.foto ?? '',
          linkedinURL: perfil.linkedinURL ?? '',
          githubURL: perfil.githubURL ?? '',
          disponibilidad: perfil.disponibilidad ?? '',
          idiomas: perfil.idiomas ?? [],
        }
      : PERFIL_VACIO,
  );

  const anadirIdioma = () =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: [...prev.idiomas, { idioma: '', nivel: '' }],
    }));

  const borrarIdioma = (indice: number) =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: prev.idiomas.filter((_, i) => i !== indice),
    }));

  const cambiarIdioma = (
    indice: number,
    campo: 'idioma' | 'nivel',
    valor: string,
  ) =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: prev.idiomas.map((item, i) =>
        i === indice ? { ...item, [campo]: valor } : item,
      ),
    }));

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: PerfilPayload = {
      ...datosPerfil,
      nombre: datosPerfil.nombre.trim(),
      apellidos: datosPerfil.apellidos.trim(),
      email: datosPerfil.email.trim(),
      telefono: datosPerfil.telefono.trim(),
      direccion: datosPerfil.direccion.trim(),
      descripcion: datosPerfil.descripcion.trim(),
      foto: datosPerfil.foto.trim(),
      linkedinURL: datosPerfil.linkedinURL.trim(),
      githubURL: datosPerfil.githubURL.trim(),
      disponibilidad: datosPerfil.disponibilidad.trim(),
      idiomas: datosPerfil.idiomas
        .map(({ idioma, nivel }) => ({
          idioma: idioma.trim(),
          nivel: nivel.trim(),
        }))
        .filter(({ idioma, nivel }) => idioma !== '' && nivel !== ''),
    };

    await onSubmitPerfil(payload);
  });

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
        <label htmlFor="descripcion">Descripción:</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={5}
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
      <div className={styles.field}>
        <label htmlFor="linkedinURL">LinkedIn:</label>
        <input
          type="url"
          id="linkedinURL"
          name="linkedinURL"
          value={datosPerfil.linkedinURL}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, linkedinURL: e.target.value })
          }
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="githubURL">GitHub:</label>
        <input
          type="url"
          id="githubURL"
          name="githubURL"
          value={datosPerfil.githubURL}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, githubURL: e.target.value })
          }
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="disponibilidad">Disponibilidad:</label>
        <input
          type="text"
          id="disponibilidad"
          name="disponibilidad"
          placeholder="Disponible de inmediato · remoto / híbrido en Murcia"
          value={datosPerfil.disponibilidad}
          onChange={(e) =>
            setDatosPerfil({ ...datosPerfil, disponibilidad: e.target.value })
          }
        />
      </div>
      <div
        className={styles.hitos}
        role="group"
        aria-labelledby="idiomas-titulo"
      >
        <span id="idiomas-titulo">Idiomas:</span>
        {datosPerfil.idiomas.map((item, indice) => (
          <div key={indice} className={styles.hitoFila}>
            <input
              type="text"
              aria-label={`Idioma ${indice + 1}`}
              placeholder="Inglés"
              value={item.idioma}
              onChange={(e) => cambiarIdioma(indice, 'idioma', e.target.value)}
            />
            <input
              type="text"
              aria-label={`Nivel del idioma ${indice + 1}`}
              placeholder="B2"
              value={item.nivel}
              onChange={(e) => cambiarIdioma(indice, 'nivel', e.target.value)}
            />
            <button
              type="button"
              aria-label={`Borrar idioma ${indice + 1}`}
              onClick={() => borrarIdioma(indice)}
            >
              X
            </button>
          </div>
        ))}
        <Button type="button" onClick={anadirIdioma} name="+ Añadir idioma" />
      </div>
      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={isPending}
          name={
            perfil
              ? isPending
                ? 'Actualizando...'
                : 'Actualizar Perfil'
              : isPending
                ? 'Creando...'
                : 'Crear Perfil'
          }
        />
      </div>
      <MensajeAccion mensaje={mensaje} />
    </form>
  );
};
