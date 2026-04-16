import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Dashboard    from "../pages/Dashboard";
import Users        from "../pages/Users";
import Socios       from "../pages/Socios";
import Therapists   from "../pages/Therapists";
import Sessions     from "../pages/Sessions";
import Facturacion  from "../pages/Facturacion";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/usuarios"    element={<Users />} />
          <Route path="/socios"      element={<Socios />} />
          <Route path="/terapeutas"  element={<Therapists />} />
          <Route path="/sesiones"    element={<Sessions />} />
          <Route path="/facturacion" element={<Facturacion />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
