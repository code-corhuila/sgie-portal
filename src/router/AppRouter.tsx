import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../modules/auth/pages/Login";
import DashboardLayout from "../components/Layout/DashboardLayout";
import PermisosList from "../modules/permisos/pages/PermisosList";
import PersonaList from "../modules/persona/pages/PersonaList";
import UbicacionList from "../modules/ubicacion/pages/UbicacionList";
import EquipoList from "../modules/equipo/pages/EquipoList";
import ReservaList from "../modules/reserva/pages/ReservaList";
import { useAuth } from "../modules/auth/context/AuthContext";
import { Spinner, Center } from "@chakra-ui/react";

function AppRouter() {
  const { role, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Routes>
      {/* Ruta pública */}
      <Route
        path="/login"
        element={!role ? <Login /> : <Navigate to="/dashboard" />}
      />

      {/* Rutas privadas */}
      {role ? (
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="permisos" element={<PermisosList />} />
          <Route path="persona" element={<PersonaList />} />
          <Route path="ubicacion" element={<UbicacionList />} />
          <Route path="equipo" element={<EquipoList />} />
          <Route path="reserva" element={<ReservaList />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}

export default AppRouter;
