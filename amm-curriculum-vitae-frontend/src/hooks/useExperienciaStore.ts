import { useDispatch, useSelector } from "react-redux";
import type { ExperienciaPayload } from "../interfaces/experiencia.interface";
import api from "../api/api";
import { setExperiencia } from "../store";

export const useExperienciaStore = () => {
  const dispatch = useDispatch();
  const { experiencia, loading, error } = useSelector(
    (state: any) => state.experiencia
  );

  const getExperiencia = async () => {
    try {
      const { data } = await api.get("/experiencia");
      console.log("Experiencia data:", data);

      dispatch(setExperiencia(data));
    } catch (error) {
      console.error("Error fetching experiencia:", error);
    }
  };

  const createExperiencia = async (payload: ExperienciaPayload) => {
    try {
      console.log("Experiencia payload:", payload);

      const { data } = await api.post("/experiencia", payload);

      dispatch(setExperiencia([...experiencia, data]));
    } catch (error) {
      console.error("Error creating experiencia:", error);
    }
  };

  const updateExperiencia = async (id: string, payload: ExperienciaPayload) => {
    try {
      const { data } = await api.put(`/experiencia/${id}`, payload);
      console.log("Experiencia updated:", data);

      dispatch(
        setExperiencia(
          experiencia.map((exp: any) => (exp.id === data.id ? data : exp))
        )
      );
    } catch (error) {
      console.error("Error updating experiencia:", error);
    }
  };

  const deleteExperiencia = async (id: string) => {
    try {
      const { data } = await api.delete(`/experiencia/${id}`);
      console.log("Experiencia deleted:", data);

      dispatch(
        setExperiencia(experiencia.filter((exp: any) => exp.id !== data.experiencia.id))
      );
    } catch (error) {
      console.error("Error deleting experiencia:", error);
    }
  };

  return {
    experiencia,
    loading,
    error,

    createExperiencia,
    updateExperiencia,
    deleteExperiencia,
    getExperiencia,
  };
};
