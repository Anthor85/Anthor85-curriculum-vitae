/// <reference types="vite/client" />

export const getEnvVariables = () => {
  const env = import.meta.env;

  return {
    ...env,
  };
};
