import { useEffect, useState } from 'react';
import { exportToPDF } from '../helpers/exportToPDF';
import { tituloCurriculum } from '../helpers/metasCurriculum';
import { ordenarCurriculum } from '../helpers/ordenarCurriculum';
import { Button } from '../components/Button';
import { Resumen } from '../components/Resumen';
import { Tabs } from '../components/Tabs';
import { useCurriculumStore } from '../hooks';
import {
  ConocimientoItem,
  Contacto,
  ExperienciaItem,
  FormacionComplementariaItem,
  FormacionItem,
} from './components/curriculum/items';

import styles from './Curriculum.module.scss';
import { Spinner } from '../components/Spinner';

export const Curriculum = () => {
  const [preparandoPDF, setPreparandoPDF] = useState(false);
  const { curriculum, getCurriculum, loading, error } = useCurriculumStore();

  useEffect(() => {
    if (!curriculum) getCurriculum();
  }, [curriculum, getCurriculum]);

  const { perfil } = curriculum || {};
  const {
    conocimientosOrdenados,
    experienciaOrdenada,
    formacionesOrdenadas,
    complementariasOrdenadas,
  } = ordenarCurriculum(curriculum);

  const nombreFichero = [perfil?.nombre, perfil?.apellidos]
    .filter((parte) => parte?.trim())
    .join(' ');
  const nombrePDF = nombreFichero ? `CV ${nombreFichero}` : 'CV';

  const titulo = tituloCurriculum(perfil);

  useEffect(() => {
    document.title = titulo;
  }, [titulo]);

  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('#favicon');
    if (!favicon) return;
    if (perfil?.foto) {
      favicon.removeAttribute('type');
      favicon.href = perfil.foto;
    } else {
      favicon.type = 'image/svg+xml';
      favicon.href = '/favicon.svg';
    }
  }, [perfil?.foto]);

  const vacio = (mensaje: string) => <p className={styles.vacio}>{mensaje}</p>;

  const tabs = [
    {
      id: 'experiencia',
      titulo: 'Experiencia',
      contenido: experienciaOrdenada.length
        ? experienciaOrdenada.map((item) => (
            <ExperienciaItem
              key={item.id}
              experiencia={item}
              conocimiento={conocimientosOrdenados}
            />
          ))
        : vacio('Sin experiencia registrada'),
    },
    {
      id: 'formacion',
      titulo: 'Formación Académica',
      contenido: formacionesOrdenadas.length
        ? formacionesOrdenadas.map((item) => (
            <FormacionItem key={item.id} formacion={item} />
          ))
        : vacio('Sin formación académica registrada'),
    },
    {
      id: 'formacion-complementaria',
      titulo: 'Formación Complementaria',
      contenido: complementariasOrdenadas.length
        ? complementariasOrdenadas.map((item) => (
            <FormacionComplementariaItem
              key={item.id}
              formacionComplementaria={item}
            />
          ))
        : vacio('Sin formación complementaria registrada'),
    },
    {
      id: 'conocimientos',
      titulo: 'Conocimientos',
      contenido: conocimientosOrdenados.length ? (
        <div className={styles.conocimientos}>
          {conocimientosOrdenados.map((item) => (
            <ConocimientoItem key={item.id} conocimiento={item} />
          ))}
        </div>
      ) : (
        vacio('Sin conocimientos registrados')
      ),
    },
  ];

  useEffect(() => {
    if (!preparandoPDF) return;
    const ordenado = ordenarCurriculum(curriculum);
    exportToPDF(
      {
        perfil: curriculum?.perfil || null,
        experiencia: ordenado.experienciaOrdenada,
        formaciones: ordenado.formacionesOrdenadas,
        formacionesComplementarias: ordenado.complementariasOrdenadas,
        conocimiento: ordenado.conocimientosOrdenados,
      },
      nombrePDF,
    ).finally(() => setPreparandoPDF(false));
  }, [preparandoPDF, curriculum, nombrePDF]);
  const cargando = loading || (!curriculum && !error);

  return cargando ? (
    <Spinner />
  ) : (
    <>
      <div id="mainPage" className={styles.MainPage}>
        <div className={styles.header}>
          {perfil && (
            <div className={styles.name}>
              <span>
                {perfil.nombre} {perfil.apellidos}
              </span>
            </div>
          )}
        </div>
        <div className={styles.basicInformation}>
          <div className={styles.column}>
            <div className={styles.identidad}>
              <Contacto perfil={perfil || null} styles={styles} />
            </div>
            {perfil?.disponibilidad && (
              <p className={styles.disponibilidad}>{perfil.disponibilidad}</p>
            )}
            <Button
              onClick={() => setPreparandoPDF(true)}
              name="Descargar CV (PDF)"
              icon="descarga"
            />
          </div>
          <div className={styles.information}>
            {perfil?.descripcion && (
              <div className={styles.resumen}>
                <Resumen texto={perfil.descripcion} />
              </div>
            )}
            <Tabs tabs={tabs} />
          </div>
        </div>
      </div>
    </>
  );
};
