import { useState, useMemo } from "react";

/**
 * Hook para ordenar tablas por columna.
 * @param {Array} data - Array de datos a ordenar
 * @param {string} defaultKey - Columna por defecto
 * @param {string} defaultDir - Dirección por defecto: "asc" | "desc"
 * @param {Object} customGetters - Funciones personalizadas para extraer valores: { key: (item) => value }
 */
export function useTableSort(data, defaultKey = null, defaultDir = "asc", customGetters = {}) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      // Usar getter personalizado si existe
      let va, vb;
      if (customGetters[sortKey]) {
        va = customGetters[sortKey](a);
        vb = customGetters[sortKey](b);
      } else {
        va = a[sortKey];
        vb = b[sortKey];
      }
      
      // Nulos al final
      if (va == null) return 1;
      if (vb == null) return -1;
      // Números
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      // Fechas
      if (va instanceof Date || (typeof va === "string" && va.match(/^\d{4}-/))) {
        return sortDir === "asc"
          ? new Date(va) - new Date(vb)
          : new Date(vb) - new Date(va);
      }
      // Strings
      const cmp = String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, customGetters]);

  return { sorted, sortKey, sortDir, toggleSort };
}

/**
 * Componente de cabecera de columna ordenable
 */
export function SortHeader({ label, sortKey: key, currentKey, currentDir, onSort, className = "" }) {
  const active = currentKey === key;
  return (
    <button
      onClick={() => onSort(key)}
      className={`flex items-center gap-1 group select-none ${className}`}
    >
      <span>{label}</span>
      <span className={`text-xs transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}>
        {active && currentDir === "desc" ? "↓" : "↑"}
      </span>
    </button>
  );
}
