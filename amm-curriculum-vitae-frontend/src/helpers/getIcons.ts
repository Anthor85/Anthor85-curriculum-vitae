export type IconName = 'sobre' | 'chincheta' | 'telefono';

export const getIcons = (iconName: IconName) => `/icons/${iconName}.svg`;
