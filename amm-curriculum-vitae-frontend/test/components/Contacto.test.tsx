import { render, screen } from '@testing-library/react';

import { Contacto } from '../../src/pages/components/curriculum/items/Contacto';
import type { Perfil } from '../../src/interfaces/perfil.interface';

const PERFIL: Perfil = {
  id: '1',
  nombre: 'Antonio',
  apellidos: 'Menéndez',
  email: 'antonio@menendez.com',
  telefono: '+34 666 555 444',
  direccion: 'Calle Mayor 5, Alicante',
  descripcion: 'Técnico en informática',
  linkedinURL: 'https://www.linkedin.com/in/antonio',
  githubURL: 'https://github.com/antonio',
};

const STYLES = { contacto: 'contacto', contacto__linea: 'linea' };

const renderContacto = (perfil: Perfil | null) =>
  render(<Contacto perfil={perfil} styles={STYLES} />);

describe('<Contacto />', () => {
  test('muestra el bloque Idiomas solo si hay idiomas', () => {
    const { unmount } = renderContacto(PERFIL);
    expect(screen.queryByText('Idiomas')).not.toBeInTheDocument();
    unmount();

    renderContacto({ ...PERFIL, idiomas: [{ idioma: 'Inglés', nivel: 'B2' }] });
    expect(screen.getByText('Idiomas')).toBeInTheDocument();
    expect(screen.getByText('Inglés · B2')).toBeInTheDocument();
  });

  test('cada linea es un enlace con su href', () => {
    renderContacto(PERFIL);

    expect(
      screen.getByRole('link', { name: PERFIL.direccion }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%205%2C%20Alicante',
    );
    expect(screen.getByRole('link', { name: PERFIL.telefono })).toHaveAttribute(
      'href',
      'tel:+34666555444',
    );
    expect(screen.getByRole('link', { name: PERFIL.email })).toHaveAttribute(
      'href',
      'mailto:antonio@menendez.com',
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      PERFIL.linkedinURL,
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      PERFIL.githubURL,
    );
  });

  test('las lineas salen en orden: direccion, telefono, email, LinkedIn y GitHub', () => {
    renderContacto(PERFIL);

    expect(
      screen.getAllByRole('link').map((enlace) => enlace.textContent),
    ).toEqual([
      PERFIL.direccion,
      PERFIL.telefono,
      PERFIL.email,
      'LinkedIn',
      'GitHub',
    ]);
  });

  test('target y rel solo en Maps, LinkedIn y GitHub', () => {
    renderContacto(PERFIL);

    for (const nombre of [PERFIL.direccion, 'LinkedIn', 'GitHub']) {
      const enlace = screen.getByRole('link', { name: nombre });
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    }
    for (const nombre of [PERFIL.telefono, PERFIL.email]) {
      const enlace = screen.getByRole('link', { name: nombre });
      expect(enlace).not.toHaveAttribute('target');
      expect(enlace).not.toHaveAttribute('rel');
    }
  });

  test('los iconos son decorativos y usan el svg de cada linea', () => {
    const { container } = renderContacto(PERFIL);

    const iconos = Array.from(container.querySelectorAll('a img'));
    expect(iconos.map((icono) => icono.getAttribute('src'))).toEqual([
      '/icons/chincheta.svg',
      '/icons/telefono.svg',
      '/icons/sobre.svg',
      '/icons/linkedin.svg',
      '/icons/github.svg',
    ]);
    iconos.forEach((icono) => expect(icono).toHaveAttribute('alt', ''));
  });

  test('sin linkedinURL no se pinta su linea', () => {
    renderContacto({ ...PERFIL, linkedinURL: undefined });

    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });

  test('sin githubURL no se pinta su linea', () => {
    renderContacto({ ...PERFIL, githubURL: '' });

    expect(screen.queryByRole('link', { name: 'GitHub' })).toBeNull();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
  });

  test('sin perfil no se pinta nada', () => {
    const { container } = renderContacto(null);

    expect(container).toBeEmptyDOMElement();
  });
});
