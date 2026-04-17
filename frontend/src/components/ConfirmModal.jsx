/**
 * Modal de confirmación reutilizable para acciones de baja/reactivación/eliminación
 */
export default function ConfirmModal({ isOpen, onClose, onConfirm, type, entityName, entityType = "registro" }) {
  if (!isOpen) return null;

  const config = {
    baja: {
      title: `⚠️ Dar de baja ${entityType}`,
      color: 'orange',
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Dar de baja',
      message: (
        <>
          ¿Estás seguro de que quieres dar de baja a <strong>{entityName}</strong>?
          <br /><br />
          El {entityType} no aparecerá en los listados activos y no se podrán generar nuevas facturas.
          El historial de sesiones y facturas se conservará.
        </>
      )
    },
    reactivar: {
      title: `✅ Reactivar ${entityType}`,
      color: 'green',
      buttonClass: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Reactivar',
      message: (
        <>
          ¿Estás seguro de que quieres reactivar a <strong>{entityName}</strong>?
          <br /><br />
          El {entityType} volverá a aparecer en los listados activos y se podrán generar facturas.
        </>
      )
    },
    eliminar: {
      title: `🗑️ Eliminar ${entityType} permanentemente`,
      color: 'red',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Eliminar permanentemente',
      headerClass: 'bg-red-50',
      titleClass: 'text-red-800',
      warning: true,
      message: (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium">⚠️ ADVERTENCIA: Esta acción no se puede deshacer</p>
          </div>
          <p className="text-gray-700 mb-4">
            ¿Estás seguro de que quieres eliminar permanentemente a <strong>{entityName}</strong>?
            <br /><br />
            Se eliminarán <strong>todos los datos</strong> incluyendo:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
            <li>Historial de sesiones</li>
            <li>Facturas generadas</li>
            <li>Datos bancarios</li>
            <li>Toda la información personal</li>
          </ul>
          <p className="text-sm text-gray-500 italic">
            💡 Recomendación: Usa "Dar de baja" en lugar de eliminar para conservar el historial.
          </p>
        </>
      )
    }
  };

  const currentConfig = config[type] || config.baja;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className={`px-6 py-4 border-b ${currentConfig.headerClass || ''}`}>
          <h2 className={`text-lg font-bold ${currentConfig.titleClass || 'text-gray-800'}`}>
            {currentConfig.title}
          </h2>
        </div>
        <div className="p-6">
          <div className="text-gray-700 mb-4">
            {currentConfig.message}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm text-white rounded-lg font-medium ${currentConfig.buttonClass}`}
            >
              {currentConfig.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
