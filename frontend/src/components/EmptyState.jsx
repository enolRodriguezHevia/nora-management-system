import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * Estado vacío reutilizable para tablas y listas
 * @param {string} title - Título principal
 * @param {string} description - Descripción secundaria
 * @param {ReactNode} action - Botón o acción opcional
 * @param {boolean} isFiltered - Si hay filtros activos (cambia el mensaje)
 */
export default function EmptyState({ title, description, action, isFiltered = false, icon: Icon = MagnifyingGlassIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">
        {isFiltered ? "Sin resultados" : title}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs">
        {isFiltered ? "Ningún registro coincide con los filtros aplicados. Prueba a cambiarlos o limpiarlos." : description}
      </p>
      {action && !isFiltered && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
