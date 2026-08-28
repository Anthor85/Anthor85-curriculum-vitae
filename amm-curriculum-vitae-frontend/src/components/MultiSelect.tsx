import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import styles from "./MultiSelect.module.scss";

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
}

export const MultiSelect = ({
  name,
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
}: MultiSelectProps) => {
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const cabeceraRef = useRef<HTMLDivElement>(null);
  const opcionesRef = useRef<(HTMLDivElement | null)[]>([]);

  const alternar = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id]
    );

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

    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto && indiceActivo >= 0) {
      opcionesRef.current[indiceActivo]?.focus();
    }
  }, [abierto, indiceActivo]);

  const teclasCabecera = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setIndiceActivo(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(true);
      setIndiceActivo(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setAbierto((prev) => !prev);
    } else if (e.key === "Escape") {
      cerrar();
    }
  };

  const teclasOpcion = (
    e: KeyboardEvent<HTMLDivElement>,
    indice: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((indice + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((indice - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      alternar(options[indice].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
      cabeceraRef.current?.focus();
    }
  };

  return (
    <div className={styles.MultiSelect} ref={contenedorRef}>
      <div
        ref={cabeceraRef}
        className={styles.cabecera}
        role="combobox"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setAbierto((prev) => !prev)}
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
        <span className={styles.mas}>+</span>
      </div>

      {abierto && (
        <div className={styles.lista} role="listbox" aria-multiselectable="true">
          {options.map((opcion, indice) => (
            <div
              key={opcion.id}
              ref={(el) => {
                opcionesRef.current[indice] = el;
              }}
              className={styles.opcion}
              role="option"
              aria-selected={selected.includes(opcion.id)}
              tabIndex={-1}
              onClick={() => alternar(opcion.id)}
              onKeyDown={(e) => teclasOpcion(e, indice)}
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
