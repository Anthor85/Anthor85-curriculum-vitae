export type IconName =
  | 'sobre'
  | 'chincheta'
  | 'telefono'
  | 'descarga'
  | 'spinner-arc'
  | 'github'
  | 'linkedin'
  | 'idiomas';

export const getIcons = (iconName: IconName) => `/icons/${iconName}.svg`;
