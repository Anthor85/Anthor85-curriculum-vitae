import { useEffect, useRef, useState } from 'react';
import { exportToPDF } from '../helpers/exportToPDF';
import { getIcons } from '../helpers/getIcons';
import { ordenarCurriculum } from '../helpers/ordenarCurriculum';
import { Button } from '../components/Button';
import { Tabs } from '../components/Tabs';
import { useCurriculumStore } from '../hooks';
import {
  ConocimientoItem,
  CurriculumPDF,
  ExperienciaItem,
  FormacionComplementariaItem,
  FormacionItem,
} from './components/curriculum/items';

import styles from './Curriculum.module.scss';
import { Contacto } from './components/curriculum/items/Contacto';

export const Curriculum = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [preparandoPDF, setPreparandoPDF] = useState(false);
  const { curriculum, getCurriculum } = useCurriculumStore();

  useEffect(() => {
    if (!curriculum) getCurriculum();
  }, []);

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

  useEffect(() => {
    document.title = nombreFichero
      ? `${nombreFichero} | Curriculum Vitae`
      : 'Curriculum Vitae';
  }, [nombreFichero]);

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
    if (!preparandoPDF || !pdfRef.current) return;
    exportToPDF(pdfRef.current, nombrePDF).finally(() =>
      setPreparandoPDF(false),
    );
  }, [preparandoPDF, nombrePDF]);

  return (
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
            <Button
              onClick={() => setPreparandoPDF(true)}
              name="Exportar a PDF"
              icon="descarga"
            />
          </div>
          <div className={styles.information}>
            {perfil && (
              <span className={styles.role}>{perfil.descripcion}</span>
            )}
            <Tabs tabs={tabs} />
          </div>
        </div>
      </div>

      {preparandoPDF && (
        <div ref={pdfRef} className={styles.pdfOculto}>
          <CurriculumPDF
            perfil={perfil || null}
            experiencia={experienciaOrdenada}
            formaciones={formacionesOrdenadas}
            formacionesComplementarias={complementariasOrdenadas}
            conocimiento={conocimientosOrdenados}
          />
        </div>
      )}
    </>
  );
};
