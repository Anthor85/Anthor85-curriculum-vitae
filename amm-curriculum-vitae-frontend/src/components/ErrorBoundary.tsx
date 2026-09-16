import { Component, type ErrorInfo, type ReactNode } from 'react';

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
      <div className={styles.ErrorBoundary} role="alert">
        <h1>Algo ha ido mal</h1>
        <p>Se ha producido un error inesperado. Prueba a recargar la página.</p>
        <Button name="Recargar" onClick={() => window.location.reload()} />
      </div>
    );
  }
}
