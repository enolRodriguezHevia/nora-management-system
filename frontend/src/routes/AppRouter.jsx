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

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/sesiones" replace />;
  return <MainLayout>{children}</MainLayout>;
}

// Redirige terapeutas al dashboard de sesiones
function TerapeutaRedirect({ children }) {
  const { isTerapeuta } = useAuth();
  if (isTerapeuta) return <Navigate to="/sesiones" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"            element={<ProtectedRoute><TerapeutaRedirect><Dashboard /></TerapeutaRedirect></ProtectedRoute>} />
      <Route path="/usuarios"    element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/usuarios/:id" element={<ProtectedRoute><FichaUsuario /></ProtectedRoute>} />
      <Route path="/socios"      element={<ProtectedRoute adminOnly><Socios /></ProtectedRoute>} />
      <Route path="/socios/:id"  element={<ProtectedRoute adminOnly><FichaSocio /></ProtectedRoute>} />
      <Route path="/terapeutas"  element={<ProtectedRoute adminOnly><Therapists /></ProtectedRoute>} />
      <Route path="/sesiones"    element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/facturacion" element={<ProtectedRoute adminOnly><Facturacion /></ProtectedRoute>} />
      <Route path="/servicios"   element={<ProtectedRoute adminOnly><Servicios /></ProtectedRoute>} />
      <Route path="/estadisticas" element={<ProtectedRoute adminOnly><Estadisticas /></ProtectedRoute>} />
      <Route path="/importar"    element={<ProtectedRoute adminOnly><Importar /></ProtectedRoute>} />
      <Route path="/sepa"        element={<ProtectedRoute adminOnly><Sepa /></ProtectedRoute>} />
      <Route path="/horarios"    element={<ProtectedRoute adminOnly><Horarios /></ProtectedRoute>} />
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
