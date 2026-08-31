// import { useDispatch, useSelector } from "react-redux";
// import api from "../api/api";
// import {
//   setError,
//   setLoading,
//   setTecnologias,
// } from "../store/curriculum/slice";
//
// export const useTecnologiasStore = () => {
//   const dispatch = useDispatch();
//   const { tecnologias, loading, error } = useSelector(
//     (state: any) => state.curriculum
//   );
//
//   const getTecnologias = async () => {
//     dispatch(setLoading(true));
//     try {
//       const { data } = await api.get("/conocimiento");
//       console.log("Tecnologias data:", data);
//
//       dispatch(setTecnologias(data));
//     } catch (error) {
//       dispatch(setError("Error fetching tecnologias"));
//       console.error("Error fetching tecnologias:", error);
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };
//
//   return {
//     tecnologias,
//     loading,
//     error,
//
//     getTecnologias,
//   };
// };
