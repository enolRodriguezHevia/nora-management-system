import { useRef, useState, useCallback } from "react";

/**
 * Hook para columnas redimensionables con drag en el borde del header.
 * @param {Object} initialWidths - { columnKey: widthInPx }
 */
export function useResizableColumns(initialWidths) {
  const [widths, setWidths] = useState(initialWidths);
  const dragging = useRef(null);

  const onMouseDown = useCallback((e, key) => {
    e.preventDefault();
    dragging.current = { key, startX: e.clientX, startWidth: widths[key] };

    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - dragging.current.startX;
      const newWidth = Math.max(60, dragging.current.startWidth + delta);
      setWidths(prev => ({ ...prev, [dragging.current.key]: newWidth }));
    };

    const onMouseUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [widths]);

  // Devuelve los props para poner en el <span> del handle, el JSX se renderiza en el componente
  const getResizeHandleProps = (key) => ({
    onMouseDown: (e) => onMouseDown(e, key),
    className: "absolute right-0 top-0 h-full w-2 cursor-col-resize select-none flex items-center justify-center group",
    title: "Arrastrar para redimensionar",
  });

  return { widths, getResizeHandleProps };
}
