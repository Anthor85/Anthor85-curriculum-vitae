export type IconName = 'sobre' | 'chincheta' | 'telefono' | 'descarga';

export const getIcons = (iconName: IconName) => `/icons/${iconName}.svg`;
