import api from "../../api/api";
import { Formacion } from "../../interfaces/formacion.interface";

export const createFormacionAction = async (data: FormData) => {
  try {
    const response = await api.post<Conocimiento>("/formacion", data);
    return response.data;
  } catch (error) {
    console.error("Error creating formacion:", error);
    throw error;
  }
};