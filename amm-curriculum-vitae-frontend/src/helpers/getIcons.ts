export type IconName =
  'sobre' | 'chincheta' | 'telefono' | 'descarga' | 'spinner-arc';

export const getIcons = (iconName: IconName) => `/icons/${iconName}.svg`;
