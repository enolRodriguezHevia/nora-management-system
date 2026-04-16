import { useEffect, useState } from "react";
import { usuariosService, sociosService, terapeutasService, sesionesService, facturasService } from "../services/api";

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border-l-4 ${color}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      usuariosService.getAll({ baja: false }),
      sociosService.getAll({ baja: false }),
      terapeutasService.getAll(),
      sesionesService.getAll({ mes: now.getMonth() + 1, anio: now.getFullYear() }),
      facturasService.getAll({ estado: "pendiente" }),
    ]).then(([usuarios, socios, terapeutas, sesiones, facturasPendientes]) => {
      setStats({
        usuarios:           usuarios.data.length,
        socios:             socios.data.length,
        terapeutas:         terapeutas.data.length,
        sesionesEsteMes:    sesiones.data.length,
        facturasPendientes: facturasPendientes.data.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const mes = now.toLocaleString("es-ES", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1 capitalize">Resumen — {mes}</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Usuarios activos"      value={stats.usuarios}           icon="👤" color="border-blue-500" />
          <StatCard label="Socios activos"         value={stats.socios}             icon="🤝" color="border-green-500" />
          <StatCard label="Terapeutas"             value={stats.terapeutas}         icon="🩺" color="border-purple-500" />
          <StatCard label="Sesiones este mes"      value={stats.sesionesEsteMes}    icon="📅" color="border-orange-500" />
          <StatCard label="Facturas pendientes"    value={stats.facturasPendientes} icon="🧾" color="border-red-500" />
        </div>
      )}
    </div>
  );
}
