import { render, screen } from '@testing-library/react';

import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const Explota = (): never => {
  throw new Error('boom');
};

describe('<ErrorBoundary />', () => {
  it('pinta los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('pinta el aviso con botón de recarga cuando un hijo lanza en render', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Explota />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Algo ha ido mal');
    expect(
      screen.getByRole('button', { name: 'Recargar' }),
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
