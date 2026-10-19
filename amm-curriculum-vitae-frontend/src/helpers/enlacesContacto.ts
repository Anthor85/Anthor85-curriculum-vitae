export const enlaceMaps = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;

// Solo limpia separadores: el prefijo de país, si se quiere, va en el campo
export const enlaceTelefono = (telefono: string) =>
  `tel:${telefono.replace(/[\s\-.()]/g, '')}`;

export const enlaceEmail = (email: string) => `mailto:${email}`;
