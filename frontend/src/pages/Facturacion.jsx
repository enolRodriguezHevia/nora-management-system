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
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [detalle, setDetalle]   = useState(null);

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

  const handleEstado = async (id, estado) => {
    await facturasService.updateEstado(id, estado);
    fetchFacturas();
    if (detalle?.id === id) setDetalle(prev => ({ ...prev, estado }));
  };

  const totalMes = facturas.reduce((acc, f) => acc + f.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Facturación</h1>
          <p className="text-gray-500 text-sm mt-1">{facturas.length} facturas — Total: {totalMes.toFixed(2)}€</p>
        </div>
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
            ) : facturas.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No hay facturas para este período</td></tr>
            ) : facturas.map(f => (
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
    </div>
  );
}
