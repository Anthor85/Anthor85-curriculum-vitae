import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import styles from './MultiSelect.module.scss';

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectProps {
  name: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  ariaLabelledBy?: string;
}

// Patron combobox de WAI-ARIA con aria-activedescendant: el foco se queda en
// la cabecera y la opcion activa se anuncia por id, sin mover el foco del DOM.
export const MultiSelect = ({
  name,
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  ariaLabelledBy,
}: MultiSelectProps) => {
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);

  const idBase = useId();
  const idLista = `${idBase}-lista`;
  const idOpcion = (indice: number) => `${idBase}-opcion-${indice}`;

  const contenedorRef = useRef<HTMLDivElement>(null);
  const opcionesRef = useRef<(HTMLDivElement | null)[]>([]);

  const alternar = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );

  const abrir = (indice: number) => {
    setAbierto(true);
    setIndiceActivo(indice);
  };

  const cerrar = () => {
    setAbierto(false);
    setIndiceActivo(-1);
  };

  useEffect(() => {
    if (!abierto) return;

    const alClicarFuera = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        cerrar();
      }
    };

    document.addEventListener('mousedown', alClicarFuera);
    return () => document.removeEventListener('mousedown', alClicarFuera);
  }, [abierto]);

  // jsdom no implementa scrollIntoView.
  useEffect(() => {
    if (abierto && indiceActivo >= 0) {
      opcionesRef.current[indiceActivo]?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [abierto, indiceActivo]);

  const teclasCabecera = (e: KeyboardEvent<HTMLDivElement>) => {
    const total = options.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (total === 0) return abrir(-1);
      abrir(abierto ? (indiceActivo + 1) % total : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (total === 0) return abrir(-1);
      abrir(abierto ? (indiceActivo - 1 + total) % total : total - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (abierto && indiceActivo >= 0) {
        alternar(options[indiceActivo].id);
      } else if (abierto) {
        cerrar();
      } else {
        setAbierto(true);
      }
    } else if (e.key === 'Escape') {
      if (abierto) e.preventDefault();
      cerrar();
    } else if (e.key === 'Tab') {
      cerrar();
    }
  };

  const idActivo =
    abierto && indiceActivo >= 0 ? idOpcion(indiceActivo) : undefined;

  return (
    <div className={styles.MultiSelect} ref={contenedorRef}>
      <div
        className={styles.cabecera}
        role="combobox"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-controls={idLista}
        aria-activedescendant={idActivo}
        aria-labelledby={ariaLabelledBy}
        tabIndex={0}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        onKeyDown={teclasCabecera}
      >
        <div className={styles.chips}>
          {selected.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            options
              .filter((opcion) => selected.includes(opcion.id))
              .map((opcion) => (
                <span key={opcion.id} className={styles.chip}>
                  {opcion.label}
                  <button
                    type="button"
                    className={styles.chipBoton}
                    aria-label={`Quitar ${opcion.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selected.filter((id) => id !== opcion.id));
                    }}
                  >
                    X
                  </button>
                </span>
              ))
          )}
        </div>
        <span className={styles.mas} aria-hidden="true">
          +
        </span>
      </div>

      {abierto && (
        <div
          id={idLista}
          className={styles.lista}
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={ariaLabelledBy}
          // Evita que el clic en una opcion quite el foco a la cabecera.
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.map((opcion, indice) => (
            <div
              key={opcion.id}
              id={idOpcion(indice)}
              ref={(el) => {
                opcionesRef.current[indice] = el;
              }}
              className={
                indice === indiceActivo
                  ? `${styles.opcion} ${styles.activa}`
                  : styles.opcion
              }
              role="option"
              aria-selected={selected.includes(opcion.id)}
              onClick={() => {
                setIndiceActivo(indice);
                alternar(opcion.id);
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(opcion.id)}
                tabIndex={-1}
                aria-hidden="true"
                readOnly
              />
              {opcion.label}
            </div>
          ))}
        </div>
      )}

      {selected.map((id) => (
        <input type="hidden" name={name} value={id} key={id} />
      ))}
    </div>
  );
};
