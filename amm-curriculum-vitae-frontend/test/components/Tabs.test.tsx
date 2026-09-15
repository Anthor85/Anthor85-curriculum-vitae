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
  {
    id: 'formacion',
    titulo: 'Formacion',
    contenido: <p>Contenido formacion</p>,
  },
];

// Tabs pinta siempre la lista de escritorio y el menu movil: los titulos estan
// duplicados en el DOM. El hamburguesa es el unico elemento con aria-label, asi
// que lo usamos de ancla para separar los dos bloques.
const hamburguesa = () =>
  screen.getByRole('button', { name: 'Abrir menú de pestañas' });

const menuMovil = () => hamburguesa().parentElement!.parentElement!;

// La lista de escritorio usa role="tab"; el desplegable movil, botones planos.
const tabEscritorio = (titulo: string) =>
  screen.getByRole('tab', { name: titulo });

const tabMovil = (titulo: string) =>
  within(menuMovil()).getByRole('button', { name: titulo });

describe('<Tabs />', () => {
  it('pinta los tres titulos como botones en la lista de escritorio', () => {
    render(<Tabs tabs={TABS} />);

    TABS.forEach((tab) => {
      expect(tabEscritorio(tab.titulo)).toBeInstanceOf(HTMLButtonElement);
    });
  });

  it('expone la semantica ARIA de tablist, tab y tabpanel', () => {
    render(<Tabs tabs={TABS} />);

    const lista = screen.getByRole('tablist');
    expect(within(lista).getAllByRole('tab')).toHaveLength(3);

    const perfil = tabEscritorio('Perfil');
    const experiencia = tabEscritorio('Experiencia');
    expect(perfil).toHaveAttribute('aria-selected', 'true');
    expect(perfil).toHaveAttribute('tabindex', '0');
    expect(experiencia).toHaveAttribute('aria-selected', 'false');
    expect(experiencia).toHaveAttribute('tabindex', '-1');

    const panel = screen.getByRole('tabpanel', { name: 'Perfil' });
    expect(perfil).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Contenido perfil');
  });

  it('navega entre tabs con flechas, Home y End moviendo el foco', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(tabEscritorio('Perfil'));

    await user.keyboard('{ArrowRight}');
    expect(tabEscritorio('Experiencia')).toHaveFocus();
    expect(tabEscritorio('Experiencia')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Contenido experiencia')).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(tabEscritorio('Formacion')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(tabEscritorio('Perfil')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(tabEscritorio('Formacion')).toHaveFocus();

    await user.keyboard('{Home}');
    expect(tabEscritorio('Perfil')).toHaveFocus();
    expect(screen.getByText('Contenido perfil')).toBeInTheDocument();
  });

  it('ignora teclas que no son de navegacion', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(tabEscritorio('Perfil'));
    await user.keyboard('a');

    expect(tabEscritorio('Perfil')).toHaveAttribute('aria-selected', 'true');
  });

  it('marca con aria-current la opcion activa del desplegable movil', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={TABS} />);

    await user.click(hamburguesa());

    expect(tabMovil('Perfil')).toHaveAttribute('aria-current', 'true');
    expect(tabMovil('Experiencia')).not.toHaveAttribute('aria-current');
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
