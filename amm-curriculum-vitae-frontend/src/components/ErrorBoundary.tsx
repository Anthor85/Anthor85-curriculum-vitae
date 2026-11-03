import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Translation } from 'react-i18next';

import { Button } from './Button';
import styles from './ErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
}

interface State {
  hayError: boolean;
}

// Sin boundary, una excepción en render desmonta todo el árbol y deja la página en blanco.
// Tiene que ser de clase: React no ofrece equivalente con hooks.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hayError: false };

  static getDerivedStateFromError(): State {
    return { hayError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hayError) return this.props.children;

    return (
      <Translation>
        {(t) => (
          <div className={styles.ErrorBoundary} role="alert">
            <h1>{t('error.titulo')}</h1>
            <p>{t('error.mensaje')}</p>
            <Button
              name={t('error.recargar')}
              onClick={() => window.location.reload()}
            />
          </div>
        )}
      </Translation>
    );
  }
}
