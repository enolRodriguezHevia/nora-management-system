import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef  = useRef();
  const menuRef = useRef();

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      const inBtn  = btnRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top:  rect.bottom + window.scrollY + 4,
        left: rect.right  + window.scrollX - 164,
      });
    }
    setOpen(o => !o);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none select-none"
        title="Acciones"
      >
        •••
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[164px]"
        >
          {items.map((item, i) =>
            item === "divider" ? (
              <div key={i} className="my-1 border-t border-gray-100" />
            ) : (
              <button
                key={i}
                onMouseDown={e => e.preventDefault()} // evita que el handler de cierre se dispare
                onClick={() => { setOpen(false); item.onClick(); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${item.className || "text-gray-700"}`}
              >
                {item.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </>
  );
}
