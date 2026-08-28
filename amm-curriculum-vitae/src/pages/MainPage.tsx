import { useEffect, useRef } from "react";
import { exportToPDF } from "../helpers/exportToPDF";
import { Button } from "../components/Button";
import { useCurriculumStore } from "../hooks/useCurriculumStore";

import styles from "./MainPage.module.scss";

export const MainPage = () => {
  const exportableHTML = useRef<HTMLDivElement>(null);
  const { curriculum, getCurriculum } = useCurriculumStore();

  useEffect(() => {
    getCurriculum();
  }, []);

  const { conocimiento, experiencia, formaciones, formacionesComplementarias, perfil } = curriculum || {};

  console.log("Curriculum in MainPage:", curriculum);

  return (
    <>
      <div id="mainPage" className={styles.MainPage} ref={exportableHTML}>
        <div className={styles.header} />
        <div className={styles.basicInformation}>
          <div className={styles.column}>
            <img
              className={styles.photo}
              src="/references/foto.jpg"
              alt="Profile"
              width={150}
            />
            <Button
              onClick={() =>
                exportableHTML.current && exportToPDF(exportableHTML.current)
              }
              name="Export to PDF"
              icon="download"
            />
          </div>
          { perfil && (<div className={styles.information}>
            <div className={styles.name}>
              <span>{perfil.nombre} {perfil.apellidos}</span>
            </div>
            <span className={styles.role}>{perfil.descripcion}</span>
            <div className={styles.info}>
              {perfil.direccion}
            </div>
            <div className={styles.info}>
              {perfil.telefono}
            </div>
            <div className={styles.info}>
              {perfil.email}
            </div>
          </div>)}
        </div>
        {/* <div className={styles.photo}> */}
        {/* </div> */}
        {/* </div> */}
      </div>
    </>
  );
};
