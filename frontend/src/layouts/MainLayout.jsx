import { Link, useLocation } from "react-router-dom";

const navGroups = [
  {
    items: [
      { to: "/",             label: "Dashboard",    icon: "📊" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { to: "/usuarios",     label: "Usuarios",     icon: "👤" },
      { to: "/socios",       label: "Socios",       icon: "🤝" },
      { to: "/terapeutas",   label: "Terapeutas",   icon: "🩺" },
      { to: "/sesiones",     label: "Sesiones",     icon: "📅" },
    ],
  },
  {
    label: "Económico",
    items: [
      { to: "/facturacion",  label: "Facturación",  icon: "🧾" },
      { to: "/servicios",    label: "Servicios",    icon: "💶" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { to: "/estadisticas", label: "Estadísticas", icon: "📈" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { to: "/importar",     label: "Importar",     icon: "📥" },
      { to: "/sepa",         label: "Remesas SEPA",  icon: "🏦" },
    ],
  },
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-800 text-white flex flex-col shadow-xl shrink-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wide text-white">NORA</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestión Interna</p>
        </div>

        <nav className="flex flex-col flex-1 p-2 gap-0.5 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.label && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map(({ to, label, icon }) => {
                const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                  >
                    <span className="text-sm">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">Asociación Nora © 2026</p>
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
