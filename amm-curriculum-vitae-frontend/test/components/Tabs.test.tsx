import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../../src/components/Tabs';

const TABS = [
  { id: 'perfil', titulo: 'Perfil', contenido: <p>Contenido perfil</p> },
  {
    id: 'experiencia',
    titulo: 'Experiencia',
    contenido: <p>Contenido experiencia</p>,
  },
  { id: 'formacion', titulo: 'Formacion', contenido: <p>Contenido formacion</p> },
];

// Tabs pinta siempre la lista de escritorio y el menu movil: los titulos estan
// duplicados en el DOM. El hamburguesa es el unico elemento con aria-label, asi
// que lo usamos de ancla para separar los dos bloques.
const hamburguesa = () =>
  screen.getByRole('button', { name: 'Abrir menú de pestañas' });

const menuMovil = () => hamburguesa().parentElement!.parentElement!;

const tabEscritorio = (titulo: string) =>
  screen
    .getAllByRole('button', { name: titulo })
    .find((boton) => !menuMovil().contains(boton))!;

const tabMovil = (titulo: string) =>
  within(menuMovil()).getByRole('button', { name: titulo });

describe('<Tabs />', () => {
  it('pinta los tres titulos como botones en la lista de escritorio', () => {
    render(<Tabs tabs={TABS} />);

    TABS.forEach((tab) => {
      expect(tabEscritorio(tab.titulo)).toBeInstanceOf(HTMLButtonElement);
    });
  });

  it('pinta el contenido de la primera tab al montar y no el de las demas', () => {
    render(<Tabs tabs={TABS} />);

    expect(screen.getByText('Contenido perfil')).toBeInTheDocument();
    expect(screen.queryByText('Contenido experiencia')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido formacion')).not.toBeInTheDocument();
  });

  it('cambia el contenido del panel al pinchar en otra tab de escritorio', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(tabEscritorio('Experiencia'));

    expect(screen.getByText('Contenido experiencia')).toBeInTheDocument();
    expect(screen.queryByText('Contenido perfil')).not.toBeInTheDocument();
  });

  it('abre el desplegable movil al pulsar el hamburguesa', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'false');

    await user.click(hamburguesa());

    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'true');
    TABS.forEach((tab) => {
      expect(tabMovil(tab.titulo)).toBeInTheDocument();
    });
  });

  it('cambia el contenido y cierra el menu al pinchar en una tab del desplegable movil', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(hamburguesa());
    await user.click(tabMovil('Formacion'));

    expect(screen.getByText('Contenido formacion')).toBeInTheDocument();
    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(menuMovil()).queryByRole('button', { name: 'Formacion' }),
    ).not.toBeInTheDocument();
  });

  it('cierra el menu abierto con un mousedown fuera del contenedor', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(hamburguesa());
    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(document.body);

    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'false');
  });
});
