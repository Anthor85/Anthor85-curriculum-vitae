import { Navigate, Route, Routes } from "react-router-dom";
import { MainPage, Experiencia, Formacion, FormacionComplementaria, Conocimiento, Perfil } from "../pages";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/experiencia" element={<Experiencia />} />
      <Route path="/conocimiento" element={<Conocimiento />} />
      <Route path="/formacion" element={<Formacion />} />
      <Route path="/formacion-complementaria" element={<FormacionComplementaria />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/*" element={<Navigate to="/" />} />
    </Routes>
  );
};
