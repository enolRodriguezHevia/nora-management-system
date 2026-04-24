import { useState } from "react";

/**
 * Sección colapsable para fichas de usuario/socio
 */
export function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h2 className="font-semibold text-gray-700 text-sm">{title}</h2>
        </div>
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && <div className="p-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/**
 * Fila de dato etiqueta-valor para fichas
 */
export function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-all min-w-0">{value}</span>
    </div>
  );
}
