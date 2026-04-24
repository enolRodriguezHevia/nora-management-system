import { useEffect, useState } from "react";
import { estadisticasService } from "../services/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { SkeletonChart } from "../components/Skeleton";

const COLORS_PIE = ["#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
const MESES_LABEL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtEuros = (v) => `${Number(v).toFixed(0)}€`;

// Wrapper que muestra "Sin datos" si el array está vacío o todos los valores son 0
function ChartWrapper({ data, valueKey, height = 240, children }) {
  const isEmpty = !data || data.length === 0 ||
    (valueKey && data.every(d => !d[valueKey] || d[valueKey] === 0));
  if (isEmpty) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <p className="text-sm text-gray-400">Sin datos para el período seleccionado</p>
      </div>
    );
  }
  return children;
}

// Genera lista de años desde el primer año con datos hasta el año actual + 1
function generarAnios() {
  const actual = new Date().getFullYear();
  const inicio = 2024; // año de arranque del sistema
  return Array.from({ length: actual - inicio + 2 }, (_, i) => inicio + i);
}

export default function Estadisticas() {
  const now = new Date();
  const [anio, setAnio]         = useState(now.getFullYear());
  const [mesDesde, setMesDesde] = useState(1);
  const [mesHasta, setMesHasta] = useState(12);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    estadisticasService.get({ anio, mesDesde, mesHasta })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [anio, mesDesde, mesHasta]);

  const periodoLabel = mesDesde === 1 && mesHasta === 12
    ? `${anio}`
    : `${MESES_LABEL[mesDesde - 1]} – ${MESES_LABEL[mesHasta - 1]} ${anio}`;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de actividad y facturación — {periodoLabel}</p>
        </div>

        {/* Filtros de período */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {generarAnios().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-gray-400 text-sm">Desde</span>
          <select
            value={mesDesde}
            onChange={e => {
              const v = Number(e.target.value);
              setMesDesde(v);
              if (v > mesHasta) setMesHasta(v);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <span className="text-gray-400 text-sm">hasta</span>
          <select
            value={mesHasta}
            onChange={e => {
              const v = Number(e.target.value);
              setMesHasta(v);
              if (v < mesDesde) setMesDesde(v);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          {(mesDesde !== 1 || mesHasta !== 12) && (
            <button
              onClick={() => { setMesDesde(1); setMesHasta(12); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Ver año completo
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonChart key={i} />)}
        </div>
      ) : !data ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Usuarios activos"       value={data.kpis.totalUsuarios}                       icon="👤" color="border-blue-500" />
            <KpiCard label="Socios activos"          value={data.kpis.totalSocios}                         icon="🤝" color="border-green-500" />
            <KpiCard label={`Sesiones ${periodoLabel}`}  value={data.kpis.totalSesionesAnio}               icon="📅" color="border-purple-500" />
            <KpiCard label={`Facturado ${periodoLabel}`} value={`${data.kpis.totalFacturadoAnio.toFixed(0)}€`} icon="💶" color="border-orange-500" />
          </div>

          {/* Fila 1: Facturación mensual + Estado facturas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Facturación mensual — {periodoLabel}</h2>
              <ChartWrapper data={data.facturacionMensual} valueKey="total" height={240}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.facturacionMensual} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtEuros} tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}€`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="subtotal"  name="Subtotal"   fill="#93c5fd" radius={[3,3,0,0]} />
                  <Bar dataKey="descuento" name="Descuento"  fill="#fca5a5" radius={[3,3,0,0]} />
                  <Bar dataKey="total"     name="Total neto" fill="#3b82f6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              </ChartWrapper>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Estado facturas — {periodoLabel}</h2>
              <ChartWrapper data={data.estadosFacturas} valueKey="count" height={200}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.estadosFacturas} dataKey="count" nameKey="estado" cx="50%" cy="50%" outerRadius={80}>
                    {data.estadosFacturas.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [`${p.payload.total?.toFixed(2)}€ (${v} facturas)`, p.payload.estado]} />
                </PieChart>
              </ResponsiveContainer>
              </ChartWrapper>
              <div className="mt-2 space-y-1">
                {data.estadosFacturas.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS_PIE[i % COLORS_PIE.length] }} />
                      {f.estado}
                    </span>
                    <span className="font-medium">{f.total.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 2: Sesiones mensuales + Estados sesiones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Sesiones mensuales — {periodoLabel}</h2>
              <ChartWrapper data={data.sesionesMensuales} valueKey="total" height={240}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.sesionesMensuales} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={35} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total"      name="Total"      stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cobrables"  name="Cobrables"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="asistencia" name="Asistencia" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              </ChartWrapper>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Distribución por estado</h2>
              <ChartWrapper data={data.estadosSesiones} valueKey="count" height={200}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.estadosSesiones} dataKey="count" nameKey="estado" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {data.estadosSesiones.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              </ChartWrapper>
              <div className="mt-2 space-y-1">
                {data.estadosSesiones.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS_PIE[i % COLORS_PIE.length] }} />
                      {e.estado}
                    </span>
                    <span className="font-medium">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 3: Ingresos por terapeuta + Top servicios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Actividad por terapeuta — {periodoLabel}</h2>
              <ChartWrapper data={data.ingresosPorTerapeuta} valueKey="sesiones" height={240}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.ingresosPorTerapeuta} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v, n) => n === "ingresos" ? [`${v.toFixed(2)}€`, "Ingresos"] : [v, "Sesiones"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sesiones" name="Sesiones" fill="#93c5fd" radius={[0,3,3,0]} />
                  <Bar dataKey="ingresos" name="Ingresos (€)" fill="#3b82f6" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
              </ChartWrapper>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Top servicios más utilizados — {periodoLabel}</h2>
              <ChartWrapper data={data.topServicios} valueKey="sesiones" height={240}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topServicios} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip formatter={(v, n) => n === "ingresos" ? [`${v.toFixed(2)}€`, "Ingresos"] : [v, "Sesiones"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sesiones" name="Sesiones" fill="#a78bfa" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
              </ChartWrapper>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border-l-4 ${color}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
