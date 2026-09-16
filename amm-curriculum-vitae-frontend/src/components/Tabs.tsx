import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

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
  const botonesRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const prefijo = useId();
  const idTab = (id: string) => `${prefijo}-tab-${id}`;
  const idPanel = `${prefijo}-panel`;
  const idDesplegable = `${prefijo}-desplegable`;

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

  const alPulsarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    const indiceActual = tabs.findIndex((tab) => tab.id === activa);
    const ultimo = tabs.length - 1;

    const destinos: Record<string, number> = {
      ArrowRight: indiceActual === ultimo ? 0 : indiceActual + 1,
      ArrowLeft: indiceActual <= 0 ? ultimo : indiceActual - 1,
      Home: 0,
      End: ultimo,
    };

    if (!(evento.key in destinos)) return;

    evento.preventDefault();
    const destino = tabs[destinos[evento.key]];
    setActiva(destino.id);
    botonesRef.current[destino.id]?.focus();
  };

  return (
    <div className={styles.Tabs}>
      <div
        className={styles.lista}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={alPulsarTecla}
      >
        {tabs.map((tab) => {
          const seleccionada = tab.id === activa;
          return (
            <button
              key={tab.id}
              ref={(boton) => {
                botonesRef.current[tab.id] = boton;
              }}
              type="button"
              role="tab"
              id={idTab(tab.id)}
              aria-selected={seleccionada}
              aria-controls={idPanel}
              tabIndex={seleccionada ? 0 : -1}
              className={`${styles.boton} ${seleccionada ? styles.activa : ''}`}
              onClick={() => setActiva(tab.id)}
            >
              {tab.titulo}
            </button>
          );
        })}
      </div>
      <div className={styles.menuMovil} ref={menuRef}>
        <div className={styles.barraMovil}>
          <span className={styles.tituloActiva}>{tabActiva?.titulo}</span>
          <button
            type="button"
            className={styles.hamburguesa}
            aria-expanded={menuAbierto}
            aria-controls={idDesplegable}
            aria-label="Abrir menú de pestañas"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            ☰
          </button>
        </div>
        {menuAbierto && (
          <div id={idDesplegable} className={styles.desplegable}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={tab.id === activa ? 'true' : undefined}
                className={`${styles.opcion} ${tab.id === activa ? styles.activa : ''}`}
                onClick={() => seleccionar(tab.id)}
              >
                {tab.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
      {tabActiva && (
        <div
          className={styles.panel}
          role="tabpanel"
          id={idPanel}
          aria-labelledby={idTab(tabActiva.id)}
          tabIndex={0}
        >
          {tabActiva.contenido}
        </div>
      )}
    </div>
  );
};
