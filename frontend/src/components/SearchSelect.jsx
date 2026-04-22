import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Select con búsqueda filtrable.
 * @param {Array}    options    - [{ value, label }]
 * @param {string}   value      - valor seleccionado
 * @param {Function} onChange   - (value) => void
 * @param {string}   placeholder
 * @param {boolean}  required
 * @param {string}   className
 */
export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = "— Seleccionar —",
  required = false,
  className = "",
  disabled = false,
}) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef();
  const inputRef     = useRef();
  const listRef      = useRef();

  const selected = options.find(o => String(o.value) === String(value));

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (containerRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    if (disabled) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPos({
        top:   rect.bottom + window.scrollY + 2,
        left:  rect.left   + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <>
      <div
        ref={containerRef}
        onClick={handleOpen}
        className={`relative flex items-center border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors
          ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "bg-white hover:border-blue-400"}
          ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-300"}
          ${className}`}
      >
        <span className={`flex-1 truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {value && !required && !disabled && (
          <button onMouseDown={handleClear} className="text-gray-300 hover:text-gray-500 ml-1 shrink-0 text-xs">✕</button>
        )}
        <span className={`ml-1 text-gray-400 text-xs transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>▼</span>
      </div>

      {open && createPortal(
        <div
          ref={listRef}
          style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        >
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Lista */}
          <div className="max-h-52 overflow-y-auto">
            {!required && (
              <button onMouseDown={() => handleSelect("")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-400 ${!value ? "bg-blue-50" : ""}`}>
                {placeholder}
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</p>
            ) : filtered.map(o => (
              <button
                key={o.value}
                onMouseDown={() => handleSelect(String(o.value))}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors
                  ${String(o.value) === String(value) ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
