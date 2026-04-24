import { useState } from "react";
import { sepaService, API_URL } from "../services/api";
import { MESES } from "../utils/constants.js";

const hoy = new Date();

export default function Sepa() {
  const [mes,        setMes]        = useState(hoy.getMonth() + 1);
  const [anio,       setAnio]       = useState(hoy.getFullYear());
  const [fechaCobro, setFechaCobro] = useState(() => {
    const d = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [preview,    setPreview]    = useState(null);
  const [cargando,   setCargando]   = useState(false);
  const [generando,  setGenerando]  = useState(false);
  const [error,      setError]      = useState(null);

  const anios = Array.from({ length: 4 }, (_, i) => hoy.getFullYear() - 1 + i);

  async function handlePreview() {
    setCargando(true);
    setError(null);
    setPreview(null);
    try {
      const r = await sepaService.preview(mes, anio);
      setPreview(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleGenerar() {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/sepa/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio, fechaCobro }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar");
      }

      // Descargar el fichero XML
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `remesa_NORA_${anio}${String(mes).padStart(2,"0")}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerando(false);
    }
  }

  const fmtEur = (n) => Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Remesas SEPA</h1>
        <p className="text-gray-500 text-sm mt-1">
          Genera el fichero XML de domiciliación bancaria (PAIN.008) para enviar al banco y cobrar las facturas pendientes del mes.
        </p>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Configuración de la remesa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Mes</label>
            <select value={mes} onChange={e => { setMes(Number(e.target.value)); setPreview(null); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Año</label>
            <select value={anio} onChange={e => { setAnio(Number(e.target.value)); setPreview(null); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Fecha de cobro</label>
            <input type="date" value={fechaCobro} onChange={e => setFechaCobro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handlePreview} disabled={cargando}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {cargando ? "Cargando..." : "🔍 Ver preview"}
          </button>
          <button onClick={handleGenerar} disabled={generando || !preview || preview.lineas.length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            {generando ? <><span className="animate-spin">⏳</span> Generando...</> : "⬇️ Descargar XML SEPA"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">❌ {error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl mb-1">🧾</div>
              <div className="text-2xl font-bold text-gray-800">{preview.lineas.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Adeudos incluidos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl mb-1">💶</div>
              <div className="text-2xl font-bold text-gray-800">{fmtEur(preview.total)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total a cobrar</div>
            </div>
            <div className={`rounded-xl border p-4 ${preview.sinIBAN.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}>
              <div className="text-2xl mb-1">⚠️</div>
              <div className={`text-2xl font-bold ${preview.sinIBAN.length > 0 ? "text-yellow-700" : "text-gray-400"}`}>
                {preview.sinIBAN.length}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Sin IBAN (excluidos)</div>
            </div>
          </div>

          {/* Tabla de adeudos */}
          {preview.lineas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                ✅ Adeudos que se incluirán en la remesa
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="px-4 py-2 text-left">Nº Recibo</th>
                    <th className="px-4 py-2 text-left">Usuario</th>
                    <th className="px-4 py-2 text-left">Deudor (socio)</th>
                    <th className="px-4 py-2 text-left">IBAN</th>
                    <th className="px-4 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.lineas.map(l => (
                    <tr key={l.facturaId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{l.numRecibo}</td>
                      <td className="px-4 py-2.5 text-gray-800">{l.concepto.split(" - ")[1]}</td>
                      <td className="px-4 py-2.5 text-gray-600">{l.deudorNombre}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                        {l.deudorIBAN.replace(/(.{4})/g, "$1 ").trim()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmtEur(l.importe)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-800">{fmtEur(preview.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Excluidos sin IBAN */}
          {preview.sinIBAN.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-yellow-100 font-semibold text-yellow-700 text-sm bg-yellow-50">
                ⚠️ Facturas excluidas — sin IBAN
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="px-4 py-2 text-left">Nº Recibo</th>
                    <th className="px-4 py-2 text-left">Usuario</th>
                    <th className="px-4 py-2 text-left">Socio</th>
                    <th className="px-4 py-2 text-left">Motivo</th>
                    <th className="px-4 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.sinIBAN.map(l => (
                    <tr key={l.facturaId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{l.numRecibo}</td>
                      <td className="px-4 py-2.5 text-gray-800">{l.usuario}</td>
                      <td className="px-4 py-2.5 text-gray-600">{l.socio}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{l.motivo}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{fmtEur(l.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.lineas.length === 0 && preview.sinIBAN.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No hay facturas pendientes para {MESES[mes-1]} {anio}
            </div>
          )}
        </div>
      )}

      {/* Info SEPA */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">ℹ️ Sobre el fichero SEPA</p>
        <p>El fichero generado sigue el estándar <strong>PAIN.008.001.02</strong> (SEPA Core Direct Debit), aceptado por todos los bancos europeos.</p>
        <p>Solo se incluyen facturas en estado <strong>pendiente</strong> cuyos socios vinculados tengan IBAN registrado.</p>
        <p>Tras descargar el fichero, súbelo al portal de tu banco para procesar los cobros en la fecha indicada.</p>
      </div>
    </div>
  );
}
