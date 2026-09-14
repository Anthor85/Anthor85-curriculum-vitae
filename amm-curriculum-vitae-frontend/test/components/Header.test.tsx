import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Header } from '../../src/components/Header';
import { renderConStore } from '../utils';

const USUARIO = { uid: '1', nombre: 'Antonio', email: 'antonio@test.com' };

const AUTENTICADO = {
  auth: {
    status: 'authenticated' as const,
    user: USUARIO,
    errorMessage: null,
  },
};

const renderHeader = (ruta = '/experiencia') =>
  renderConStore(
    <MemoryRouter initialEntries={[ruta]}>
      <Header />
    </MemoryRouter>,
    AUTENTICADO,
  );

describe('<Header />', () => {
  it('pinta un enlace por cada seccion privada', () => {
    renderHeader();

    const enlaces = [
      ['Experiencia', '/experiencia'],
      ['Conocimiento', '/conocimiento'],
      ['Formación', '/formacion'],
      ['F. Complementaria', '/formacion-complementaria'],
      ['Perfil', '/perfil'],
    ];

    enlaces.forEach(([texto, href]) => {
      expect(screen.getByRole('link', { name: texto })).toHaveAttribute(
        'href',
        href,
      );
    });
  });

  it('marca como activo el enlace de la ruta actual', () => {
    renderHeader('/perfil');

    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Experiencia' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('muestra el nombre del usuario autenticado', () => {
    renderHeader();

    expect(screen.getByText('Antonio')).toBeInTheDocument();
  });

  it('cierra la sesion al pulsar Salir', async () => {
    const user = userEvent.setup();
    const { store } = renderHeader();

    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(store.getState().auth.status).toBe('not-authenticated');
    expect(store.getState().auth.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
