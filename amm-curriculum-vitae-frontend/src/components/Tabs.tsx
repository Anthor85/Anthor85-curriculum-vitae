import { ReactNode, useState } from 'react';

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

  const tabActiva = tabs.find((tab) => tab.id === activa);

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
      <div className={styles.panel}>{tabActiva?.contenido}</div>
    </div>
  );
};
