import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Los hooks filtran con `isAxiosError()`, que exige una instancia real: un
// objeto plano con `response` no cuela como error de axios.
export const errorAxios = <T = unknown>(status: number, data?: T) => {
  const config = {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;

  const response = {
    status,
    statusText: '',
    data: data as T,
    headers: new AxiosHeaders(),
    config,
  } as AxiosResponse<T>;

  return new AxiosError<T>(
    `Request failed with status code ${status}`,
    String(status),
    config,
    {},
    response,
  );
};
