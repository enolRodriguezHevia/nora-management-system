import { useEffect, useState } from "react";
import { sesionesService, terapeutasService, usuariosService, serviciosService } from "../services/api";

const ESTADOS = [
  { value: "asistio",              label: "Asistió",                color: "bg-green-100 text-green-700" },
  { value: "falta",                label: "Falta (cobra)",          color: "bg-yellow-100 text-yellow-700" },
  { value: "festivo",              label: "Festivo",                color: "bg-blue-100 text-blue-700" },
  { value: "vacaciones_terapeuta", label: "Vacaciones terapeuta",   color: "bg-purple-100 text-purple-700" },
  { value: "permiso",              label: "Permiso",                color: "bg-orange-100 text-orange-700" },
  { value: "hospitalizacion",      label: "Hospitalización",        color: "bg-red-100 text-red-700" },
];

const EMPTY_FORM = {
  usuarioId: "", terapeutaId: "", servicioId: "",
  fecha: new Date().toISOString().slice(0, 10),
  estado: "asistio", actividadRealizada: "", motivacion: "", observaciones: "",
};

export default function Sessions() {
  const now = new Date();
  const [mes, setMes]               = useState(now.getMonth() + 1);
  const [anio, setAnio]             = useState(now.getFullYear());
  const [terapeutaFiltro, setTerapeutaFiltro] = useState("");
  const [sesiones, setSesiones]     = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [usuarios, setUsuarios]     = useState([]);
  const [servicios, setServicios]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const fetchSesiones = () => {
    setLoading(true);
    sesionesService.getAll({ mes, anio, terapeutaId: terapeutaFiltro || undefined })
      .then(r => setSesiones(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    terapeutasService.getAll().then(r => setTerapeutas(r.data));
    usuariosService.getAll({ baja: false }).then(r => setUsuarios(r.data));
    serviciosService.getAll().then(r => setServicios(r.data));
  }, []);

  useEffect(() => { fetchSesiones(); }, [mes, anio, terapeutaFiltro]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      usuarioId:   Number(form.usuarioId),
      terapeutaId: Number(form.terapeutaId),
      servicioId:  Number(form.servicioId),
    };
    try {
      await sesionesService.create(payload);
      setModal(false);
      fetchSesiones();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta sesión?")) return;
    await sesionesService.delete(id);
    fetchSesiones();
  };

  const estadoInfo = (val) => ESTADOS.find(e => e.value === val) || ESTADOS[0];

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sesiones</h1>
          <p className="text-gray-500 text-sm mt-1">{sesiones.length} sesiones registradas</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Registrar sesión
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={terapeutaFiltro} onChange={e => setTerapeutaFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los terapeutas</option>
          {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos} — {t.especialidad}</option>)}
        </select>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ESTADOS.map(e => (
          <span key={e.value} className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.color}`}>{e.label}</span>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Fecha", "Usuario", "Terapeuta", "Servicio", "Estado", "Cobrable", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : sesiones.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay sesiones para este período</td></tr>
            ) : sesiones.map(s => {
              const est = estadoInfo(s.estado);
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{new Date(s.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.usuario?.nombre} {s.usuario?.apellidos}</td>
                  <td className="px-4 py-3 text-gray-600">{s.terapeuta?.nombre} {s.terapeuta?.apellidos}</td>
                  <td className="px-4 py-3 text-gray-600">{s.servicio?.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cobrable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.cobrable ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal nueva sesión */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Registrar sesión</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Usuario *</label>
                  <select name="usuarioId" value={form.usuarioId} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Seleccionar usuario —</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Terapeuta *</label>
                  <select name="terapeutaId" value={form.terapeutaId} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Seleccionar —</option>
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
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fecha *</label>
                  <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Estado *</label>
                  <select name="estado" value={form.estado} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Actividad realizada</label>
                  <input type="text" name="actividadRealizada" value={form.actividadRealizada} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
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
      )}
    </div>
  );
}
