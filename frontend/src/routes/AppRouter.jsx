import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import MainLayout   from "../layouts/MainLayout";
import Login        from "../pages/Login";
import Dashboard    from "../pages/Dashboard";
import Users        from "../pages/Users";
import Socios       from "../pages/Socios";
import Therapists   from "../pages/Therapists";
import Sessions     from "../pages/Sessions";
import Facturacion  from "../pages/Facturacion";
import Servicios    from "../pages/Servicios";
import Estadisticas from "../pages/Estadisticas";
import Importar     from "../pages/Importar";
import Sepa         from "../pages/Sepa";
import Horarios     from "../pages/Horarios";
import FichaUsuario from "../pages/FichaUsuario";
import FichaSocio   from "../pages/FichaSocio";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/usuarios"    element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/usuarios/:id" element={<ProtectedRoute><FichaUsuario /></ProtectedRoute>} />
      <Route path="/socios"      element={<ProtectedRoute><Socios /></ProtectedRoute>} />
      <Route path="/socios/:id"  element={<ProtectedRoute><FichaSocio /></ProtectedRoute>} />
      <Route path="/terapeutas"  element={<ProtectedRoute><Therapists /></ProtectedRoute>} />
      <Route path="/sesiones"    element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/facturacion" element={<ProtectedRoute><Facturacion /></ProtectedRoute>} />
      <Route path="/servicios"   element={<ProtectedRoute><Servicios /></ProtectedRoute>} />
      <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
      <Route path="/importar"    element={<ProtectedRoute><Importar /></ProtectedRoute>} />
      <Route path="/sepa"        element={<ProtectedRoute><Sepa /></ProtectedRoute>} />
      <Route path="/horarios"    element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
