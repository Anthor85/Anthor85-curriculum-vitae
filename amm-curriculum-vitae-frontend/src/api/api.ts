import axios from "axios";
import { getEnvVariables } from "../helpers/getEnvVariables";

const { VITE_BASE_URL } = getEnvVariables();

console.log("VITE_BASE_URL:", VITE_BASE_URL);

export const api = axios.create({
  baseURL: VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
