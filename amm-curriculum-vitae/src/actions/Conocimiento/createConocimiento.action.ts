import api from "../../api/api";
import { Conocimiento } from "../../interfaces/conocimiento.interface";

export const createConocimientoAction = async (data: FormData) => {
  try {
    const response = await api.post<Conocimiento>("/conocimiento", data);
    return response.data;
  } catch (error) {
    console.error("Error creating conocimiento:", error);
    throw error;
  }
};
