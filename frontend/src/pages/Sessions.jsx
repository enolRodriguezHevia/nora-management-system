import { useEffect, useState, useCallback } from "react";
import { sesionesService, terapeutasService, usuariosService, serviciosService } from "../services/api";

// ── Configuración de estados ──────────────────────────────────────────────────
const ESTADOS = {
  asistio:              { label: "Asistió",              color: "bg-green-200 text-green-800",   dot: "bg-green-500",   cobrable: true  },
  falta:                { label: "Falta (cobra)",         color: "bg-yellow-200 text-yellow-800", dot: "bg-yellow-500",  cobrable: true  },
  festivo:              { label: "Festivo/Fin de semana", color: "bg-blue-200 text-blue-800",     dot: "bg-blue-500",    cobrable: false },
  vacaciones_terapeuta: { label: "Vacaciones terapeuta",  color: "bg-purple-200 text-purple-800", dot: "bg-purple-500",  cobrable: false },
  permiso:              { label: "Permiso",               color: "bg-orange-200 text-orange-800", dot: "bg-orange-500",  cobrable: false },
  hospitalizacion:      { label: "Hospitalización",       color: "bg-red-200 text-red-800",       dot: "bg-red-500",     cobrable: false },
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function diasEnMes(mes, anio) {
  return new Date(anio, mes, 0).getDate();
}

function esFinde(dia, mes, anio) {
  const d = new Date(anio, mes - 1, dia).getDay();
  return d === 0 || d === 6;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Sessions() {
  const now = new Date();
  const [mes, setMes]                     = useState(now.getMonth() + 1);
  const [anio, setAnio]                   = useState(now.getFullYear());
  const [terapeutaId, setTerapeutaId]     = useState("");
  const [terapeutas, setTerapeutas]       = useState([]);
  const [usuarios, setUsuarios]           = useState([]);
  const [servicios, setServicios]         = useState([]);
  const [sesiones, setSesiones]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [panel, setPanel]                 = useState(null); // { usuarioId, dia }
  const [addModal, setAddModal]           = useState(false);

  // Cargar catálogos una sola vez
  useEffect(() => {
    terapeutasService.getAll().then(r => {
      setTerapeutas(r.data);
      if (r.data.length > 0) setTerapeutaId(String(r.data[0].id));
    });
    usuariosService.getAll({ baja: false }).then(r => setUsuarios(r.data));
    serviciosService.getAll().then(r => setServicios(r.data));
  }, []);

  const fetchSesiones = useCallback(() => {
    if (!terapeutaId) return;
    setLoading(true);
    sesionesService.getAll({ mes, anio, terapeutaId })
      .then(r => setSesiones(r.data))
      .finally(() => setLoading(false));
  }, [mes, anio, terapeutaId]);

  useEffect(() => { fetchSesiones(); }, [fetchSesiones]);

  // ── Índice de sesiones por usuarioId+día ─────────────────────────────────
  const sesionIndex = {};
  for (const s of sesiones) {
    const dia = parseInt(s.fecha.slice(8, 10), 10);
    const key = `${s.usuarioId}-${dia}`;
    if (!sesionIndex[key]) sesionIndex[key] = [];
    sesionIndex[key].push(s);
  }

  // ── Usuarios que tienen al menos una sesión con este terapeuta este mes ──
  const usuariosConSesion = usuarios.filter(u =>
    sesiones.some(s => s.usuarioId === u.id)
  );

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalSesiones  = sesiones.length;
  const cobrables      = sesiones.filter(s => s.cobrable).length;
  const noCobrables    = totalSesiones - cobrables;
  const faltas         = sesiones.filter(s => s.estado === "falta").length;
  const pctAsistencia  = totalSesiones > 0
    ? Math.round((sesiones.filter(s => s.estado === "asistio").length / totalSesiones) * 100)
    : 0;

  const numDias = diasEnMes(mes, anio);
  const dias = Array.from({ length: numDias }, (_, i) => i + 1);

  const terapeutaActual = terapeutas.find(t => String(t.id) === terapeutaId);

  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sesiones</h1>
          <p className="text-gray-500 text-sm mt-1">
            {terapeutaActual ? `${terapeutaActual.especialidad} — ${terapeutaActual.nombre} ${terapeutaActual.apellidos}` : "Selecciona un terapeuta"}
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Registrar sesión
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Terapeuta</label>
          <select value={terapeutaId} onChange={e => setTerapeutaId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {terapeutas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre} {t.apellidos} — {t.especialidad}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mes</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Año</label>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total sesiones"   value={totalSesiones} color="border-blue-500"   />
        <MetricCard label="Cobrables"         value={cobrables}     color="border-green-500"  />
        <MetricCard label="No cobrables"      value={noCobrables}   color="border-gray-400"   />
        <MetricCard label="% Asistencia"      value={`${pctAsistencia}%`} color="border-purple-500" />
      </div>

      {/* ── Leyenda ── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ESTADOS).map(([key, e]) => (
          <span key={key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.color}`}>
            {e.label}
          </span>
        ))}
      </div>

      {/* ── Grid + Panel lateral ── */}
      <div className="flex gap-4">

        {/* Grid */}
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Cargando...</div>
          ) : usuariosConSesion.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No hay sesiones registradas para este terapeuta en {MESES[mes-1]} {anio}
            </div>
          ) : (
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-10 bg-slate-800 text-left px-3 py-2 font-semibold min-w-[160px] border-r border-slate-600">
                    Usuario
                  </th>
                  {dias.filter(d => !esFinde(d, mes, anio)).map(d => {
                    const esHoy = d === now.getDate() && mes === now.getMonth()+1 && anio === now.getFullYear();
                    const diaSemana = ["D","L","M","X","J","V","S"][new Date(anio, mes-1, d).getDay()];
                    return (
                      <th key={d}
                        className={`px-0 py-1 text-center font-medium min-w-[32px] w-8
                          ${esHoy ? "bg-blue-600" : ""}`}>
                        <div className="text-xs font-bold">{d}</div>
                        <div className="text-[9px] opacity-70">{diaSemana}</div>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center font-semibold min-w-[44px] bg-slate-700 text-xs">Ses.</th>
                  <th className="px-2 py-2 text-center font-semibold min-w-[44px] bg-slate-700 text-xs">Cob.</th>
                  <th className="px-2 py-2 text-center font-semibold min-w-[70px] bg-slate-700 text-xs">Asist.</th>
                </tr>
              </thead>
              <tbody>
                {usuariosConSesion.map((u, idx) => {
                  const sesU    = sesiones.filter(s => s.usuarioId === u.id);
                  const cobU    = sesU.filter(s => s.cobrable).length;
                  const asistU  = sesU.filter(s => s.estado === "asistio").length;
                  const pctU    = sesU.length > 0 ? Math.round((asistU / sesU.length) * 100) : 0;
                  return (
                    <tr key={u.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:brightness-95 transition-all`}>
                      <td className={`sticky left-0 z-10 px-3 py-1.5 font-medium text-gray-700 border-r border-gray-200 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        {u.nombre} {u.apellidos}
                      </td>
                      {dias.filter(d => !esFinde(d, mes, anio)).map(d => {
                        const key = `${u.id}-${d}`;
                        const celdaSesiones = sesionIndex[key] || [];
                        const panelActivo = panel?.usuarioId === u.id && panel?.dia === d;
                        const esHoy = d === now.getDate() && mes === now.getMonth()+1 && anio === now.getFullYear();

                        if (celdaSesiones.length === 0) {
                          return (
                            <td key={d}
                              className={`border border-gray-100 text-center cursor-pointer transition-colors w-8 h-7
                                ${esHoy ? "bg-blue-50" : ""}
                                ${panelActivo ? "ring-2 ring-inset ring-blue-400" : "hover:bg-blue-50"}`}
                              onClick={() => setPanel({ usuarioId: u.id, dia: d, sesiones: [], usuario: u })}
                            />
                          );
                        }

                        const s = celdaSesiones[0];
                        const est = ESTADOS[s.estado] || ESTADOS.asistio;
                        return (
                          <td key={d}
                            className={`border border-gray-100 text-center cursor-pointer transition-all w-8 h-7
                              ${est.color}
                              ${panelActivo ? "ring-2 ring-inset ring-blue-500 brightness-90" : "hover:brightness-90"}`}
                            onClick={() => setPanel({ usuarioId: u.id, dia: d, sesiones: celdaSesiones, usuario: u })}
                            title={`${est.label}${s.actividadRealizada ? " — " + s.actividadRealizada : ""}`}
                          >
                            {celdaSesiones.length > 1 && (
                              <span className="font-bold text-[10px]">{celdaSesiones.length}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-100 text-center font-semibold text-gray-700 bg-gray-50 text-xs">{sesU.length}</td>
                      <td className="border border-gray-100 text-center font-semibold text-green-700 bg-green-50 text-xs">{cobU}</td>
                      <td className="border border-gray-100 px-2 bg-gray-50">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pctU >= 80 ? "bg-green-500" : pctU >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${pctU}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-7 text-right">{pctU}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel lateral */}
        {panel && (
          <PanelDetalle
            panel={panel}
            mes={mes}
            anio={anio}
            terapeutaId={terapeutaId}
            terapeutas={terapeutas}
            servicios={servicios}
            onClose={() => setPanel(null)}
            onRefresh={fetchSesiones}
          />
        )}
      </div>

      {/* Modal añadir sesión */}
      {addModal && (
        <ModalAddSesion
          usuarios={usuarios}
          terapeutas={terapeutas}
          servicios={servicios}
          defaultTerapeutaId={terapeutaId}
          defaultMes={mes}
          defaultAnio={anio}
          onClose={() => setAddModal(false)}
          onSave={() => { setAddModal(false); fetchSesiones(); }}
        />
      )}
    </div>
  );
}

// ── Panel lateral de detalle ──────────────────────────────────────────────────
function PanelDetalle({ panel, mes, anio, terapeutaId, terapeutas, servicios, onClose, onRefresh }) {
  const [form, setForm] = useState({
    estado: "asistio",
    servicioId: "",
    actividadRealizada: "",
    motivacion: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fecha = `${anio}-${String(mes).padStart(2,"0")}-${String(panel.dia).padStart(2,"0")}`;
  const terapeutaActual = terapeutas.find(t => String(t.id) === String(terapeutaId));
  const sesion = panel.sesiones?.[0];

  useEffect(() => {
    if (sesion) {
      setForm({
        estado:             sesion.estado,
        servicioId:         String(sesion.servicioId),
        actividadRealizada: sesion.actividadRealizada || "",
        motivacion:         sesion.motivacion || "",
        observaciones:      sesion.observaciones || "",
      });
    } else {
      setForm({ estado: "asistio", servicioId: "", actividadRealizada: "", motivacion: "", observaciones: "" });
    }
  }, [panel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.servicioId) {
      alert("Selecciona un servicio antes de guardar");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        usuarioId:   panel.usuarioId,
        terapeutaId: Number(terapeutaId),
        servicioId:  Number(form.servicioId),
        fecha,
        estado:             form.estado,
        actividadRealizada: form.actividadRealizada,
        motivacion:         form.motivacion,
        observaciones:      form.observaciones,
      };
      if (sesion) {
        await sesionesService.update(sesion.id, payload);
      } else {
        await sesionesService.create(payload);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sesion) return;
    setDeleting(true);
    try {
      await sesionesService.delete(sesion.id);
      onRefresh();
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const diaSemana = new Date(anio, mes - 1, panel.dia).toLocaleDateString("es-ES", { weekday: "long" });

  return (
    <div className="w-72 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col shrink-0">
      {/* Cabecera panel */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 rounded-t-xl">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{panel.usuario.nombre} {panel.usuario.apellidos}</p>
          <p className="text-xs text-gray-500 capitalize">{diaSemana} {panel.dia} de {MESES[mes-1]}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {/* Estado */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Estado</label>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(ESTADOS).map(([key, e]) => (
              <button
                key={key}
                onClick={() => setForm(f => ({ ...f, estado: key }))}
                className={`text-xs px-2 py-1.5 rounded-lg border transition-all text-left
                  ${form.estado === key
                    ? `${e.color} border-transparent font-semibold`
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${e.dot}`} />
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Servicio */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">
            Servicio <span className="text-red-500">*</span>
          </label>
          <select name="servicioId" value={form.servicioId} onChange={handleChange}
            className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500
              ${!form.servicioId ? "border-red-300 bg-red-50" : "border-gray-300"}`}>
            <option value="">— Seleccionar servicio —</option>
            {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.precio}€)</option>)}
          </select>
          {!form.servicioId && (
            <p className="text-xs text-red-500 mt-0.5">Requerido para registrar la sesión</p>
          )}
        </div>

        {/* Actividad */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Actividad realizada</label>
          <input type="text" name="actividadRealizada" value={form.actividadRealizada} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Ejercicios de fonación..." />
        </div>

        {/* Motivación */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Motivación / Nota</label>
          <textarea name="motivacion" value={form.motivacion} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observaciones de la sesión..." />
        </div>

        {/* Cobrable info */}
        <div className={`text-xs px-3 py-2 rounded-lg font-medium ${ESTADOS[form.estado]?.cobrable ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {ESTADOS[form.estado]?.cobrable ? "✓ Esta sesión se cobrará" : "✗ Esta sesión no se cobrará"}
        </div>
      </div>

      {/* Acciones */}
      <div className="p-4 border-t space-y-2">
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? "Guardando..." : sesion ? "Actualizar sesión" : "Registrar sesión"}
        </button>
        {sesion && (
          <button onClick={() => setConfirmDelete(true)} disabled={deleting}
            className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            {deleting ? "Eliminando..." : "Eliminar sesión"}
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-bold text-gray-800">¿Eliminar esta sesión?</h2>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal añadir sesión ───────────────────────────────────────────────────────
function ModalAddSesion({ usuarios, terapeutas, servicios, defaultTerapeutaId, defaultMes, defaultAnio, onClose, onSave }) {
  const [form, setForm] = useState({
    usuarioId:   "",
    terapeutaId: defaultTerapeutaId,
    servicioId:  "",
    fecha:       `${defaultAnio}-${String(defaultMes).padStart(2,"0")}-01`,
    estado:      "asistio",
    actividadRealizada: "",
    motivacion:  "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await sesionesService.create({
        ...form,
        usuarioId:   Number(form.usuarioId),
        terapeutaId: Number(form.terapeutaId),
        servicioId:  Number(form.servicioId),
      });
      onSave();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Registrar sesión</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Usuario *</label>
            <select name="usuarioId" value={form.usuarioId} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Seleccionar —</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Terapeuta *</label>
            <select name="terapeutaId" value={form.terapeutaId} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Servicio *</label>
            <select name="servicioId" value={form.servicioId} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Seleccionar —</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.precio}€)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estado *</label>
              <select name="estado" value={form.estado} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(ESTADOS).map(([k, e]) => <option key={k} value={k}>{e.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Actividad realizada</label>
            <input type="text" name="actividadRealizada" value={form.actividadRealizada} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
              {saving ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta de métrica ────────────────────────────────────────────────────────
function MetricCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
