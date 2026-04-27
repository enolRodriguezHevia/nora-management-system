/**
 * Componente de paginación reutilizable
 * @param {number} page - Página actual (1-indexed)
 * @param {number} total - Total de registros
 * @param {number} perPage - Registros por página
 * @param {Function} onChange - Callback (nuevaPagina) => void
 */
export default function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Mostrar máximo 5 páginas alrededor de la actual
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
      <span className="text-xs text-gray-400">
        {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} de {total}
      </span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
          ←
        </button>
        {visible.map((p, i) => (
          <>
            {i > 0 && visible[i - 1] !== p - 1 && (
              <span key={`dots-${p}`} className="px-1 py-1 text-xs text-gray-300">…</span>
            )}
            <button key={p} onClick={() => onChange(p)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                p === page
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 hover:bg-gray-50"
              }`}>
              {p}
            </button>
          </>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
          →
        </button>
      </div>
    </div>
  );
}
