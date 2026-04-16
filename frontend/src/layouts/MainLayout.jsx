import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/",            label: "Dashboard",    icon: "📊" },
  { to: "/usuarios",    label: "Usuarios",     icon: "👤" },
  { to: "/socios",      label: "Socios",       icon: "🤝" },
  { to: "/terapeutas",  label: "Terapeutas",   icon: "🩺" },
  { to: "/sesiones",    label: "Sesiones",     icon: "📅" },
  { to: "/facturacion", label: "Facturación",  icon: "🧾" },
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-800 text-white flex flex-col shadow-xl shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-wide text-white">NORA</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestión Interna</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, label, icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">Asociación Nora © 2026</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
