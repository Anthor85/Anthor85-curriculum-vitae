import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import type { Perfil, PerfilPayload } from '../../interfaces/perfil.interface';

import { Button } from '../../components/Button';
import { CampoLocalizado } from '../../components/CampoLocalizado';
import { SugerirVacios } from '../../components/SugerirVacios';
import type { Traduccion } from '../../components/SugerirVacios';
import { TEXTO_VACIO, trimLocalizado } from '../../helpers/textoLocalizado';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const PERFIL_VACIO: PerfilPayload = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: TEXTO_VACIO,
  descripcion: TEXTO_VACIO,
  foto: '',
  linkedinURL: '',
  githubURL: '',
  disponibilidad: TEXTO_VACIO,
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
          disponibilidad: perfil.disponibilidad ?? TEXTO_VACIO,
          idiomas: perfil.idiomas ?? [],
        }
      : PERFIL_VACIO,
  );

  const anadirIdioma = () =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: [...prev.idiomas, { idioma: TEXTO_VACIO, nivel: TEXTO_VACIO }],
    }));

  const borrarIdioma = (indice: number) =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: prev.idiomas.filter((_, i) => i !== indice),
    }));

  const cambiarIdioma = (
    indice: number,
    campo: 'idioma' | 'nivel',
    idioma: 'es' | 'en',
    valor: string,
  ) =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: prev.idiomas.map((item, i) =>
        i === indice
          ? { ...item, [campo]: { ...item[campo], [idioma]: valor } }
          : item,
      ),
    }));

  // Cada fila aporta dos valores a SugerirVacios: [idioma, nivel]
  const valoresIdiomas = datosPerfil.idiomas.flatMap(({ idioma, nivel }) => [
    idioma,
    nivel,
  ]);

  const aplicarTraducciones = (traducciones: Traduccion[]) =>
    setDatosPerfil((prev) => ({
      ...prev,
      idiomas: prev.idiomas.map((item, fila) => {
        const enDe = (posicion: number) =>
          traducciones.find(({ indice }) => indice === posicion)?.en;
        const enIdioma = enDe(fila * 2);
        const enNivel = enDe(fila * 2 + 1);
        return {
          idioma:
            enIdioma === undefined
              ? item.idioma
              : { ...item.idioma, en: enIdioma },
          nivel:
            enNivel === undefined ? item.nivel : { ...item.nivel, en: enNivel },
        };
      }),
    }));

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: PerfilPayload = {
      ...datosPerfil,
      nombre: datosPerfil.nombre.trim(),
      apellidos: datosPerfil.apellidos.trim(),
      email: datosPerfil.email.trim(),
      telefono: datosPerfil.telefono.trim(),
      direccion: trimLocalizado(datosPerfil.direccion),
      descripcion: trimLocalizado(datosPerfil.descripcion),
      foto: datosPerfil.foto.trim(),
      linkedinURL: datosPerfil.linkedinURL.trim(),
      githubURL: datosPerfil.githubURL.trim(),
      disponibilidad: trimLocalizado(datosPerfil.disponibilidad),
      idiomas: datosPerfil.idiomas
        .map(({ idioma, nivel }) => ({
          idioma: trimLocalizado(idioma),
          nivel: trimLocalizado(nivel),
        }))
        .filter(({ idioma, nivel }) => idioma.es !== '' && nivel.es !== ''),
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
      <CampoLocalizado
        id="direccion"
        etiqueta="Dirección"
        valor={datosPerfil.direccion}
        onChange={(direccion) =>
          setDatosPerfil((prev) => ({ ...prev, direccion }))
        }
        required
      />
      <CampoLocalizado
        id="descripcion"
        etiqueta="Descripción"
        valor={datosPerfil.descripcion}
        onChange={(descripcion) =>
          setDatosPerfil((prev) => ({ ...prev, descripcion }))
        }
        multilinea
        required
      />
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
      <CampoLocalizado
        id="disponibilidad"
        etiqueta="Disponibilidad"
        valor={datosPerfil.disponibilidad}
        onChange={(disponibilidad) =>
          setDatosPerfil((prev) => ({ ...prev, disponibilidad }))
        }
      />
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
              aria-label={`Idioma ${indice + 1} (ES)`}
              placeholder="Inglés"
              value={item.idioma.es}
              onChange={(e) =>
                cambiarIdioma(indice, 'idioma', 'es', e.target.value)
              }
            />
            <input
              type="text"
              aria-label={`Idioma ${indice + 1} (EN)`}
              placeholder="English"
              value={item.idioma.en}
              onChange={(e) =>
                cambiarIdioma(indice, 'idioma', 'en', e.target.value)
              }
            />
            <input
              type="text"
              aria-label={`Nivel del idioma ${indice + 1} (ES)`}
              placeholder="B2"
              value={item.nivel.es}
              onChange={(e) =>
                cambiarIdioma(indice, 'nivel', 'es', e.target.value)
              }
            />
            <input
              type="text"
              aria-label={`Nivel del idioma ${indice + 1} (EN)`}
              placeholder="B2"
              value={item.nivel.en}
              onChange={(e) =>
                cambiarIdioma(indice, 'nivel', 'en', e.target.value)
              }
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
        <SugerirVacios
          valores={valoresIdiomas}
          onTraducidos={aplicarTraducciones}
        />
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
