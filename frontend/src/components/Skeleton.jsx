/**
 * Componentes de skeleton loading reutilizables
 */

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${80 + Math.random() * 40}px` }} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            {[...Array(cols)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 80}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-16" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mb-4" />
      <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
    </div>
  );
}

export function SkeletonFicha() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-48" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-24 mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-3 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
