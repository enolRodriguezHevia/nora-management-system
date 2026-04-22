import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
  HeartIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

const navGroups = [
  {
    items: [
      { to: "/",             label: "Dashboard",    icon: Squares2X2Icon },
    ],
  },
  {
    label: "Gestión",
    items: [
      { to: "/usuarios",     label: "Usuarios",     icon: UserGroupIcon },
      { to: "/socios",       label: "Socios",       icon: UsersIcon },
      { to: "/terapeutas",   label: "Terapeutas",   icon: HeartIcon },
      { to: "/sesiones",     label: "Sesiones",     icon: CalendarDaysIcon },
    ],
  },
  {
    label: "Económico",
    items: [
      { to: "/facturacion",  label: "Facturación",  icon: DocumentTextIcon },
      { to: "/servicios",    label: "Servicios",    icon: CurrencyEuroIcon },
    ],
  },
  {
    label: "Análisis",
    items: [
      { to: "/estadisticas", label: "Estadísticas", icon: ChartBarIcon },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { to: "/horarios",     label: "Horarios",     icon: CalendarDaysIcon },
      { to: "/importar",     label: "Importar",     icon: ArrowUpTrayIcon },
      { to: "/sepa",         label: "Remesas SEPA", icon: BuildingLibraryIcon },
    ],
  },
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="px-5 py-4 border-b border-slate-700/60">
          <h1 className="text-lg font-bold text-white tracking-wide">NORA</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión Interna</p>
        </div>

        <nav className="flex flex-col flex-1 p-2 gap-0.5 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-medium">{user?.nombre}</p>
              <p className="text-xs text-slate-500">{user?.username}</p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="text-slate-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-slate-800">
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
