import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ICONS = {
  success: CheckCircleIcon,
  error:   XCircleIcon,
  warning: ExclamationTriangleIcon,
};

const STYLES = {
  success: "bg-white border-green-200 text-green-800",
  error:   "bg-white border-red-200 text-red-800",
  warning: "bg-white border-yellow-200 text-yellow-800",
};

const ICON_STYLES = {
  success: "text-green-500",
  error:   "text-red-500",
  warning: "text-yellow-500",
};

function ToastItem({ id, type = "success", message, onRemove }) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[type];
  // Los errores duran más tiempo (10s) para que el usuario pueda leerlos
  const autoClose = true;
  const duration  = type === "error" ? 10000 : 3500;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (!autoClose) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full
      transition-all duration-300 ${STYLES[type]}
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_STYLES[type]}`} />
      <p className="text-sm font-medium flex-1 whitespace-pre-line">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
        className="text-gray-400 hover:text-gray-600 shrink-0">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Hook para usar toasts ────────────────────────────────────────────────────
let _addToast = null;

export function useToast() {
  return {
    success: (msg) => _addToast?.({ type: "success", message: msg }),
    error:   (msg) => _addToast?.({ type: "error",   message: msg }),
    warning: (msg) => _addToast?.({ type: "warning", message: msg }),
  };
}

// ─── Contenedor global de toasts ─────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (toast) => {
      setToasts(prev => [...prev, { ...toast, id: Date.now() + Math.random() }]);
    };
    return () => { _addToast = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 items-end">
      {toasts.map(t => <ToastItem key={t.id} {...t} onRemove={remove} />)}
    </div>,
    document.body
  );
}
