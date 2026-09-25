export const dateConverter = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // fuerza 2 dígitos
  return `${month}/${year}`;
};
