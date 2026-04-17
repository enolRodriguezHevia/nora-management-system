/**
 * Panel de filtros avanzados reutilizable
 */
export default function AdvancedFilters({ 
  isOpen, 
  onToggle, 
  activeCount, 
  onClear, 
  children 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">🔍 Filtros avanzados</span>
          {activeCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {activeCount} activo{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {children}

          {/* Botón limpiar filtros */}
          {activeCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={onClear}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
