import { ReactNode, useEffect, useRef, useState } from 'react';

import styles from './Tabs.module.scss';

interface Tab {
  id: string;
  titulo: string;
  contenido: ReactNode;
}

interface Props {
  tabs: Tab[];
}

export const Tabs = ({ tabs }: Props) => {
  const [activa, setActiva] = useState<string>(tabs[0]?.id ?? '');
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const tabActiva = tabs.find((tab) => tab.id === activa);

  useEffect(() => {
    if (!menuAbierto) return;

    const alPulsarFuera = (evento: MouseEvent) => {
      if (!menuRef.current?.contains(evento.target as Node)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener('mousedown', alPulsarFuera);
    return () => document.removeEventListener('mousedown', alPulsarFuera);
  }, [menuAbierto]);

  const seleccionar = (id: string) => {
    setActiva(id);
    setMenuAbierto(false);
  };

  return (
    <div className={styles.Tabs}>
      <div className={styles.lista}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.boton} ${tab.id === activa ? styles.activa : ''}`}
            onClick={() => setActiva(tab.id)}
          >
            {tab.titulo}
          </button>
        ))}
      </div>
      <div className={styles.menuMovil} ref={menuRef}>
        <div className={styles.barraMovil}>
          <span className={styles.tituloActiva}>{tabActiva?.titulo}</span>
          <button
            type="button"
            className={styles.hamburguesa}
            aria-expanded={menuAbierto}
            aria-label="Abrir menú de pestañas"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            ☰
          </button>
        </div>
        {menuAbierto && (
          <div className={styles.desplegable}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.opcion} ${tab.id === activa ? styles.activa : ''}`}
                onClick={() => seleccionar(tab.id)}
              >
                {tab.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.panel}>{tabActiva?.contenido}</div>
    </div>
  );
};
