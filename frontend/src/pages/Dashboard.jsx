import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usuariosService, sociosService, terapeutasService, sesionesService, facturasService, avisosService } from "../services/api";
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
  const navigate = useNavigate();
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [avisos, setAvisos]   = useState([]);

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

    // Avisos pendientes de todos los usuarios
    avisosService.getAll({ resuelto: false }).then(r => setAvisos(r.data));
  }, []);

  const now = new Date();
  const mes = now.toLocaleString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img src="/nora-icono-solo.png" alt="NORA" className="h-16 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NORA Management System</h1>
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

      {/* Avisos pendientes */}
      {avisos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">📌</span>
              <h2 className="font-semibold text-gray-700 text-sm">Avisos pendientes</h2>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{avisos.length}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {avisos.slice(0, 5).map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{a.texto}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.usuario?.nombre} {a.usuario?.apellidos}</p>
                </div>
                <button
                  onClick={() => navigate(`/usuarios/${a.usuarioId}`)}
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  Ver ficha →
                </button>
              </div>
            ))}
            {avisos.length > 5 && (
              <div className="px-5 py-2 text-xs text-gray-400 text-center">
                y {avisos.length - 5} más...
              </div>
            )}
          </div>
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
