import { useEffect, useRef } from 'react';
import { exportToPDF } from '../helpers/exportToPDF';
import { getIcons } from '../helpers/getIcons';
import { ordenarCurriculum } from '../helpers/ordenarCurriculum';
import { Button } from '../components/Button';
import { Tabs } from '../components/Tabs';
import { useCurriculumStore } from '../hooks/useCurriculumStore';
import {
  ConocimientoItem,
  CurriculumPDF,
  ExperienciaItem,
  FormacionComplementariaItem,
  FormacionItem,
} from './curriculum';

import styles from './MainPage.module.scss';

export const MainPage = () => {
  const exportableHTML = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { curriculum, getCurriculum } = useCurriculumStore();

  useEffect(() => {
    getCurriculum();
  }, []);

  const { perfil } = curriculum || {};
  const {
    conocimientos,
    experienciaOrdenada,
    formacionesOrdenadas,
    complementariasOrdenadas,
  } = ordenarCurriculum(curriculum);

  const nombreFichero = [perfil?.nombre, perfil?.apellidos]
    .filter((parte) => parte?.trim())
    .join(' ');
  const nombrePDF = nombreFichero ? `CV ${nombreFichero}` : 'CV';

  const vacio = (mensaje: string) => <p className={styles.vacio}>{mensaje}</p>;

  const tabs = [
    {
      id: 'experiencia',
      titulo: 'Experiencia',
      contenido: experienciaOrdenada.length ? (
        <div className={styles.twoColumnsPerRow}>
          {experienciaOrdenada.map((item) => (
            <ExperienciaItem
              key={item.id}
              experiencia={item}
              conocimiento={conocimientos}
            />
          ))}
        </div>
      ) : (
        vacio('Sin experiencia registrada')
      ),
    },
    {
      id: 'formacion',
      titulo: 'Formación Académica',
      contenido: formacionesOrdenadas.length ? (
        <div className={styles.twoColumnsPerRow}>
          {formacionesOrdenadas.map((item) => (
            <FormacionItem key={item.id} formacion={item} />
          ))}
        </div>
      ) : (
        vacio('Sin formación académica registrada')
      ),
    },
    {
      id: 'formacion-complementaria',
      titulo: 'Formación Complementaria',
      contenido: complementariasOrdenadas.length ? (
        <div className={styles.twoColumnsPerRow}>
          {complementariasOrdenadas.map((item) => (
            <FormacionComplementariaItem
              key={item.id}
              formacionComplementaria={item}
            />
          ))}
        </div>
      ) : (
        vacio('Sin formación complementaria registrada')
      ),
    },
    {
      id: 'conocimientos',
      titulo: 'Conocimientos',
      contenido: conocimientos.length ? (
        <div className={styles.twoColumnsPerRow}>
          {conocimientos.map((item) => (
            <ConocimientoItem key={item.id} conocimiento={item} />
          ))}
        </div>
      ) : (
        vacio('Sin conocimientos registrados')
      ),
    },
  ];

  return (
    <>
      <div id="mainPage" className={styles.MainPage} ref={exportableHTML}>
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
            </div>
            <Button
              onClick={() =>
                pdfRef.current && exportToPDF(pdfRef.current, nombrePDF)
              }
              name="Export to PDF"
              icon="download"
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

      <div ref={pdfRef} className={styles.pdfOculto}>
        <CurriculumPDF
          perfil={perfil || null}
          experiencia={experienciaOrdenada}
          formaciones={formacionesOrdenadas}
          formacionesComplementarias={complementariasOrdenadas}
          conocimiento={conocimientos}
        />
      </div>
    </>
  );
};
