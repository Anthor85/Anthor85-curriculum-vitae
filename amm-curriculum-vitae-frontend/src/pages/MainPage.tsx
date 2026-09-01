import { useEffect, useRef } from 'react';
import { exportToPDF } from '../helpers/exportToPDF';
import { getIcons } from '../helpers/getIcons';
import { Button } from '../components/Button';
import { Tabs } from '../components/Tabs';
import { useCurriculumStore } from '../hooks/useCurriculumStore';
import {
  ConocimientoItem,
  ExperienciaItem,
  FormacionComplementariaItem,
  FormacionItem,
} from './curriculum';

import styles from './MainPage.module.scss';

const tiempo = (fecha?: string) => (fecha ? new Date(fecha).getTime() || 0 : 0);

export const MainPage = () => {
  const exportableHTML = useRef<HTMLDivElement>(null);
  const { curriculum, getCurriculum } = useCurriculumStore();

  useEffect(() => {
    getCurriculum();
  }, []);

  const {
    conocimiento,
    experiencia,
    formaciones,
    formacionesComplementarias,
    perfil,
  } = curriculum || {};

  const experienciaOrdenada = [...(experiencia || [])].sort(
    (a, b) => tiempo(b.fechaInicio) - tiempo(a.fechaInicio),
  );
  const formacionesOrdenadas = [...(formaciones || [])].sort(
    (a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin),
  );
  const complementariasOrdenadas = [
    ...(formacionesComplementarias || []),
  ].sort((a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin));
  const conocimientos = conocimiento || [];

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
              conocimiento={conocimientos}
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
      contenido: conocimientos.length
        ? conocimientos.map((item) => (
            <ConocimientoItem key={item.id} conocimiento={item} />
          ))
        : vacio('Sin conocimientos registrados'),
    },
  ];

  return (
    <>
      <div id="mainPage" className={styles.MainPage} ref={exportableHTML}>
        <div className={styles.header} />
        <div className={styles.basicInformation}>
          <div className={styles.column}>
            <img
              className={styles.photo}
              src={perfil?.foto || '/references/foto.jpg'}
              alt="Profile"
              width={150}
            />
            {perfil && (
              <div className={styles.contacto}>
                <div className={styles.contacto__linea}>
                  <img src={getIcons('chincheta')} alt="" width={18} />
                  <span>{perfil.direccion}</span>
                </div>
                <div className={styles.contacto__linea}>
                  <img src={getIcons('telefono')} alt="" width={18} />
                  <span>{perfil.telefono}</span>
                </div>
                <div className={styles.contacto__linea}>
                  <img src={getIcons('sobre')} alt="" width={18} />
                  <span>{perfil.email}</span>
                </div>
              </div>
            )}
            <Button
              onClick={() =>
                exportableHTML.current && exportToPDF(exportableHTML.current)
              }
              name="Export to PDF"
              icon="download"
            />
          </div>
          <div className={styles.information}>
            {perfil && (
              <>
                <div className={styles.name}>
                  <span>
                    {perfil.nombre} {perfil.apellidos}
                  </span>
                </div>
                <span className={styles.role}>{perfil.descripcion}</span>
              </>
            )}
            <Tabs tabs={tabs} />
          </div>
        </div>
      </div>
    </>
  );
};
