import { useEffect, useState } from "react";
import { usuariosService, sociosService, terapeutasService, sesionesService, facturasService } from "../services/api";
import {
  UserGroupIcon,
  UsersIcon,
  HeartIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const STAT_CARDS = [
  { key: "usuarios",           label: "Usuarios activos",    icon: UserGroupIcon,          color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
  { key: "socios",             label: "Socios activos",      icon: UsersIcon,              color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
  { key: "terapeutas",         label: "Terapeutas",          icon: HeartIcon,              color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  { key: "sesionesEsteMes",    label: "Sesiones este mes",   icon: CalendarDaysIcon,       color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { key: "facturasPendientes", label: "Facturas pendientes", icon: DocumentTextIcon,       color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100" },
];

export default function Dashboard() {
  const [stats, setStats]   = useState({});
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
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img src="/nora-icono-solo.png" alt="NORA" className="h-16 w-auto object-contain rounded-xl" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bienvenido al sistema de gestión</h1>
            <p className="text-gray-400 text-sm mt-0.5 capitalize">{mes}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
            <div key={key} className={`bg-white rounded-xl border ${border} p-5 flex items-center gap-4 shadow-sm`}>
              <div className={`${bg} ${color} p-3 rounded-xl`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats[key] ?? "—"}</p>
                <p className="text-sm text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aviso facturas pendientes */}
      {!loading && stats.facturasPendientes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            Hay <span className="font-semibold">{stats.facturasPendientes} facturas pendientes</span> de cobro.
          </p>
          <a href="/facturacion" className="ml-auto text-sm text-amber-700 font-semibold hover:underline whitespace-nowrap">
            Ver facturas →
          </a>
        </div>
      )}

      {/* Info sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Gestión integral", desc: "Usuarios, socios, terapeutas y sesiones en un único sistema centralizado.", icon: "🗂️" },
          { title: "Facturación automática", desc: "Generación de facturas desde sesiones con descuentos aplicados automáticamente.", icon: "⚡" },
          { title: "Exportación y remesas", desc: "Exporta a Excel, genera PDFs y ficheros SEPA para domiciliación bancaria.", icon: "📤" },
        ].map(c => (
          <div key={c.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-2xl mb-3">{c.icon}</div>
            <h3 className="font-semibold text-gray-700 mb-1">{c.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
