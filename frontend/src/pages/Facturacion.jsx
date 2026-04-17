import { useEffect, useState } from "react";
import { facturasService, usuariosService } from "../services/api";
import { generarPDFFactura } from "../utils/pdfGenerator";

const MESES_LABEL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_COLOR = {
  pendiente: "bg-yellow-100 text-yellow-700",
  cobrada:   "bg-green-100 text-green-700",
  anulada:   "bg-red-100 text-red-700",
};

export default function Facturacion() {
  const now = new Date();
  const [mes, setMes]           = useState(now.getMonth() + 1);
  const [anio, setAnio]         = useState(now.getFullYear());
  const [facturas, setFacturas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingMasivo, setGeneratingMasivo] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [detalle, setDetalle]   = useState(null);
  const [modalMasivo, setModalMasivo] = useState(false);
  const [resultadoMasivo, setResultadoMasivo] = useState(null);
  
  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroMinImporte, setFiltroMinImporte] = useState("");
  const [filtroMaxImporte, setFiltroMaxImporte] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const fetchFacturas = () => {
    setLoading(true);
    facturasService.getAll({ mes, anio })
      .then(r => setFacturas(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    usuariosService.getAll({ baja: false }).then(r => setUsuarios(r.data));
  }, []);

  useEffect(() => { fetchFacturas(); }, [mes, anio]);

  const handleGenerar = async () => {
    if (!selectedUsuario) return alert("Selecciona un usuario");
    setGenerating(true);
    try {
      await facturasService.generar({ usuarioId: Number(selectedUsuario), mes, anio });
      fetchFacturas();
      setSelectedUsuario("");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handlePDF = (factura) => {
    console.log("Intentando generar PDF para:", factura);
    generarPDFFactura(factura);
  };

  const handleGenerarMasivo = async () => {
    setGeneratingMasivo(true);
    try {
      const response = await facturasService.generarMasivo({ mes, anio });
      setResultadoMasivo(response.data);
      fetchFacturas();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingMasivo(false);
    }
  };

  const handleEstado = async (id, estado) => {
    await facturasService.updateEstado(id, estado);
    fetchFacturas();
    if (detalle?.id === id) setDetalle(prev => ({ ...prev, estado }));
  };

  // Aplicar filtros
  const facturasFiltradas = facturas.filter(f => {
    // Filtro por estado
    if (filtroEstado !== "todos" && f.estado !== filtroEstado) return false;
    
    // Filtro por búsqueda (nombre de usuario)
    if (filtroBusqueda) {
      const nombreCompleto = `${f.usuario?.nombre} ${f.usuario?.apellidos}`.toLowerCase();
      if (!nombreCompleto.includes(filtroBusqueda.toLowerCase())) return false;
    }
    
    // Filtro por importe mínimo
    if (filtroMinImporte && f.total < Number(filtroMinImporte)) return false;
    
    // Filtro por importe máximo
    if (filtroMaxImporte && f.total > Number(filtroMaxImporte)) return false;
    
    return true;
  });

  const totalMes = facturasFiltradas.reduce((acc, f) => acc + f.total, 0);
  const contadorFiltros = [
    filtroEstado !== "todos",
    filtroBusqueda,
    filtroMinImporte,
    filtroMaxImporte
  ].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Facturación</h1>
          <p className="text-gray-500 text-sm mt-1">
            {facturasFiltradas.length} facturas
            {contadorFiltros > 0 && ` (${facturas.length} total)`}
            {" — Total: "}
            {totalMes.toFixed(2)}€
          </p>
        </div>
        <button
          onClick={() => setModalMasivo(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg">⚡</span>
          Generar todas las facturas del mes
        </button>
      </div>

      {/* Filtros + Generar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mes</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Año</label>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Generar factura para usuario</label>
          <select value={selectedUsuario} onChange={e => setSelectedUsuario(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Seleccionar usuario —</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
          </select>
        </div>
        <button onClick={handleGenerar} disabled={generating || !selectedUsuario}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {generating ? "Generando..." : "Generar factura"}
        </button>
      </div>

      {/* Filtros avanzados */}
      <div className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">🔍 Filtros avanzados</span>
            {contadorFiltros > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {contadorFiltros} activo{contadorFiltros > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className={`text-gray-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {mostrarFiltros && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por estado */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cobrada">Cobrada</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>

              {/* Búsqueda por usuario */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium">Buscar usuario</label>
                <input
                  type="text"
                  value={filtroBusqueda}
                  onChange={e => setFiltroBusqueda(e.target.value)}
                  placeholder="Nombre o apellidos..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Importe mínimo */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium">Importe mínimo (€)</label>
                <input
                  type="number"
                  value={filtroMinImporte}
                  onChange={e => setFiltroMinImporte(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Importe máximo */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-medium">Importe máximo (€)</label>
                <input
                  type="number"
                  value={filtroMaxImporte}
                  onChange={e => setFiltroMaxImporte(e.target.value)}
                  placeholder="999"
                  min="0"
                  step="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {contadorFiltros > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setFiltroEstado("todos");
                    setFiltroBusqueda("");
                    setFiltroMinImporte("");
                    setFiltroMaxImporte("");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla facturas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Nº Recibo", "Usuario", "Mes/Año", "Subtotal", "Descuento", "Total", "Estado", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : facturasFiltradas.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                {contadorFiltros > 0 ? "No hay facturas que coincidan con los filtros" : "No hay facturas para este período"}
              </td></tr>
            ) : facturasFiltradas.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.numRecibo}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{f.usuario?.nombre} {f.usuario?.apellidos}</td>
                <td className="px-4 py-3 text-gray-600">{MESES_LABEL[f.mes - 1]} {f.anio}</td>
                <td className="px-4 py-3 text-gray-600">{f.subtotal.toFixed(2)}€</td>
                <td className="px-4 py-3 text-red-600">{f.descuento > 0 ? `-${f.descuento.toFixed(2)}€` : "—"}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{f.total.toFixed(2)}€</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[f.estado]}`}>
                    {f.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setDetalle(f)} className="text-blue-600 hover:underline text-xs">Ver</button>
                    <button 
                      onClick={() => handlePDF(f)} 
                      className="text-purple-600 hover:underline text-xs font-medium"
                      title="Descargar PDF"
                    >
                      📄 PDF
                    </button>
                    {f.estado === "pendiente" && (
                      <button onClick={() => handleEstado(f.id, "cobrada")} className="text-green-600 hover:underline text-xs">Cobrar</button>
                    )}
                    {f.estado !== "anulada" && (
                      <button onClick={() => handleEstado(f.id, "anulada")} className="text-red-500 hover:underline text-xs">Anular</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalle factura */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Factura {detalle.numRecibo}</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handlePDF(detalle)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  title="Descargar PDF"
                >
                  📄 Descargar PDF
                </button>
                <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Usuario:</span> {detalle.usuario?.nombre} {detalle.usuario?.apellidos}</p>
                <p><span className="font-medium">Período:</span> {MESES_LABEL[detalle.mes - 1]} {detalle.anio}</p>
                <p><span className="font-medium">Fecha:</span> {new Date(detalle.fecha).toLocaleDateString("es-ES")}</p>
              </div>

              <table className="w-full text-sm border-t border-gray-200 pt-2">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-2">Tratamiento</th>
                    <th className="text-right py-2">Sesiones</th>
                    <th className="text-right py-2">Precio/ses.</th>
                    <th className="text-right py-2">Suma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalle.lineas?.map(l => (
                    <tr key={l.id}>
                      <td className="py-2 text-gray-700">{l.servicio?.nombre}</td>
                      <td className="py-2 text-right text-gray-600">{l.numSesiones}</td>
                      <td className="py-2 text-right text-gray-600">{l.precioSesion.toFixed(2)}€</td>
                      <td className="py-2 text-right font-medium">{l.suma.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{detalle.subtotal.toFixed(2)}€</span>
                </div>
                {detalle.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>10% descuento</span><span>-{detalle.descuento.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 text-base border-t pt-2">
                  <span>TOTAL</span><span>{detalle.total.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación generación masiva */}
      {modalMasivo && !resultadoMasivo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Generación masiva de facturas</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Se generarán facturas automáticamente para <strong>todos los usuarios</strong> que tengan sesiones cobrables en:
                </p>
                <p className="text-lg font-bold text-blue-900 mt-2">
                  {MESES_LABEL[mes - 1]} {anio}
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  ⚠️ Los usuarios que ya tengan factura generada para este mes serán omitidos.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalMasivo(false)}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarMasivo}
                  disabled={generatingMasivo}
                  className="flex-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {generatingMasivo ? "Generando..." : "Confirmar y generar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal resultado generación masiva */}
      {resultadoMasivo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Resultado de generación masiva</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Facturas generadas</span>
                  <span className="text-2xl font-bold text-green-600">{resultadoMasivo.generadas}</span>
                </div>
                
                {resultadoMasivo.yaExistian > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Ya existían</span>
                    <span className="text-2xl font-bold text-blue-600">{resultadoMasivo.yaExistian}</span>
                  </div>
                )}
                
                {resultadoMasivo.errores > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-800">Errores</span>
                      <span className="text-2xl font-bold text-red-600">{resultadoMasivo.errores}</span>
                    </div>
                    <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {resultadoMasivo.detalleErrores?.map((err, idx) => (
                        <div key={idx} className="bg-white p-2 rounded">
                          <strong>{err.usuario}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setResultadoMasivo(null);
                  setModalMasivo(false);
                }}
                className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
