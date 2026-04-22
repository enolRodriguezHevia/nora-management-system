/**
 * Modal de confirmación reutilizable.
 *
 * Props:
 * - isOpen, onClose, onConfirm — control del modal
 * - type: "baja" | "reactivar" | "eliminar" — define título, colores y texto por defecto
 * - entityName — nombre del elemento afectado
 * - entityType — tipo de entidad (ej: "usuario", "socio", "horario")
 * - message — (opcional) JSX o string para sobreescribir el mensaje por defecto
 * - confirmText — (opcional) texto del botón de confirmación
 * - title — (opcional) título personalizado
 */
export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  type, entityName, entityType = "registro",
  message, confirmText, title,
}) {
  if (!isOpen) return null;

  const defaults = {
    baja: {
      title:       `⚠️ Dar de baja ${entityType}`,
      buttonClass: "bg-orange-600 hover:bg-orange-700",
      buttonText:  "Dar de baja",
      message: (
        <>
          ¿Estás seguro de que quieres dar de baja a <strong>{entityName}</strong>?
          <br /><br />
          El {entityType} no aparecerá en los listados activos y no se podrán generar nuevas facturas.
          El historial de sesiones y facturas se conservará.
        </>
      ),
    },
    reactivar: {
      title:       `✅ Reactivar ${entityType}`,
      buttonClass: "bg-green-600 hover:bg-green-700",
      buttonText:  "Reactivar",
      message: (
        <>
          ¿Estás seguro de que quieres reactivar a <strong>{entityName}</strong>?
          <br /><br />
          El {entityType} volverá a aparecer en los listados activos y se podrán generar facturas.
        </>
      ),
    },
    eliminar: {
      title:       `🗑️ Eliminar ${entityType}`,
      buttonClass: "bg-red-600 hover:bg-red-700",
      buttonText:  "Eliminar",
      headerClass: "bg-red-50",
      titleClass:  "text-red-800",
      message: (
        <>
          ¿Estás seguro de que quieres eliminar <strong>{entityName}</strong>?
          <br />
          <span className="text-sm text-gray-400">Esta acción no se puede deshacer.</span>
        </>
      ),
    },
  };

  const cfg = defaults[type] || defaults.baja;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className={`px-6 py-4 border-b ${cfg.headerClass || ""}`}>
          <h2 className={`text-lg font-bold ${cfg.titleClass || "text-gray-800"}`}>
            {title || cfg.title}
          </h2>
        </div>
        <div className="p-6">
          <div className="text-gray-700 mb-4">
            {message || cfg.message}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm text-white rounded-lg font-medium ${cfg.buttonClass}`}>
              {confirmText || cfg.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
