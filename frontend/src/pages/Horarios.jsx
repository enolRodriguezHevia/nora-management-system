import { useEffect, useState } from "react";
import { horariosService, terapeutasService, usuariosService, serviciosService } from "../services/api";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import ConfirmModal from "../components/ConfirmModal";
import SearchSelect from "../components/SearchSelect";
import { ESPECIALIDAD_COLOR, ESPECIALIDAD_TITULO } from "../utils/especialidades";
import { MESES } from "../utils/constants.js";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export default function Horarios() {
  const toast = useToast();
  const now = new Date();

  const [horarios,    setHorarios]    = useState([]);
  const [terapeutas,  setTerapeutas]  = useState([]);
  const [usuarios,    setUsuarios]    = useState([]);
  const [servicios,   setServicios]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [generando,   setGenerando]   = useState(false);
  const [generandoCurso, setGenerandoCurso] = useState(false);
  const [modalGen,    setModalGen]    = useState(false);
  const [modalCurso,  setModalCurso]  = useState(false);
  const [cursoDesde,  setCursoDesde]  = useState({ mes: now.getMonth() + 1, anio: now.getFullYear() });
  const [cursoHasta,  setCursoHasta]  = useState({ mes: 6, anio: now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear() });
  const [modalElim,   setModalElim]   = useState(null);
  const [mes,         setMes]         = useState(now.getMonth() + 1);
  const [anio,        setAnio]        = useState(now.getFullYear());
  const [filtroTer,   setFiltroTer]   = useState("");

  const [form, setForm] = useState({
    usuarioId: "", terapeutaId: "", servicioId: "", diaSemana: "",
  });

  const fetchHorarios = () => {
    setLoading(true);
    horariosService.getAll()
      .then(r => setHorarios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHorarios();
    terapeutasService.getAll().then(r => setTerapeutas(r.data));
    usuariosService.getAll({ baja: false }).then(r => setUsuarios(r.data));
    serviciosService.getAll().then(r => setServicios(r.data));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await horariosService.create({
        usuarioId:   Number(form.usuarioId),
        terapeutaId: Number(form.terapeutaId),
        servicioId:  Number(form.servicioId),
        diaSemana:   Number(form.diaSemana),
      });
      setForm({ usuarioId: "", terapeutaId: "", servicioId: "", diaSemana: "" });
      setShowForm(false);
      fetchHorarios();
      toast.success("Horario añadido correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modalElim) return;
    try {
      await horariosService.delete(modalElim.id);
      setModalElim(null);
      fetchHorarios();
      toast.success("Horario eliminado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleGenerarMes = async () => {
    setGenerando(true);
    setModalGen(false);
    try {
      const r = await horariosService.generarMes({ mes, anio });
      toast.success(`✅ ${r.data.creadas} sesiones programadas generadas para ${MESES[mes-1]} ${anio}`);
      if (r.data.yaExistian > 0) toast.warning(`${r.data.yaExistian} sesiones ya existían y no se duplicaron`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerando(false);
    }
  };

  const handleGenerarCurso = async () => {
    setGenerandoCurso(true);
    setModalCurso(false);
    try {
      const r = await horariosService.generarCurso({
        mesDesde: cursoDesde.mes, anioDesde: cursoDesde.anio,
        mesHasta: cursoHasta.mes, anioHasta: cursoHasta.anio,
      });
      toast.success(`✅ ${r.data.creadas} sesiones generadas para ${r.data.meses} meses (${r.data.rango})`);
      if (r.data.yaExistian > 0) toast.warning(`${r.data.yaExistian} sesiones ya existían y no se duplicaron`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerandoCurso(false);
    }
  };

  // Agrupar por terapeuta
  const horariosFiltrados = filtroTer
    ? horarios.filter(h => String(h.terapeutaId) === filtroTer)
    : horarios;

  const porTerapeuta = horariosFiltrados.reduce((acc, h) => {
    const key = h.terapeutaId;
    if (!acc[key]) acc[key] = { terapeuta: h.terapeuta, items: [] };
    acc[key].items.push(h);
    return acc;
  }, {});

  const anios = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Horarios habituales</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define qué días acude cada usuario a cada terapia para generar el mes automáticamente
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Añadir horario
        </button>
      </div>

      {/* Formulario añadir */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-slide-up">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm">Nuevo horario habitual</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario *</label>
              <SearchSelect
                value={form.usuarioId}
                onChange={v => setForm(f => ({...f, usuarioId: v}))}
                placeholder="— Seleccionar —"
                required
                options={usuarios.map(u => ({ value: u.id, label: `${u.nombre} ${u.apellidos}` }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Terapeuta *</label>
              <SearchSelect
                value={form.terapeutaId}
                onChange={v => setForm(f => ({...f, terapeutaId: v}))}
                placeholder="— Seleccionar —"
                required
                options={terapeutas.map(t => ({ value: t.id, label: `${t.nombre} ${t.apellidos} — ${t.especialidad}` }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Servicio *</label>
              <SearchSelect
                value={form.servicioId}
                onChange={v => setForm(f => ({...f, servicioId: v}))}
                placeholder="— Seleccionar —"
                required
                options={servicios.map(s => ({ value: s.id, label: s.nombre }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Día de la semana *</label>
              <SearchSelect
                value={form.diaSemana}
                onChange={v => setForm(f => ({...f, diaSemana: v}))}
                placeholder="— Seleccionar —"
                required
                options={DIAS.slice(1).map((d, i) => ({ value: i+1, label: d }))}
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Guardando..." : "Añadir"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generar mes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-gray-700">Generar sesiones del mes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Crea automáticamente todas las sesiones del mes en estado "Programada" según los horarios habituales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={mes} onChange={e => setMes(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={() => setModalGen(true)} disabled={generando || horarios.length === 0}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-2">
              {generando ? <><span className="animate-spin">⏳</span> Generando...</> : "⚡ Generar mes"}
            </button>
            <button onClick={() => setModalCurso(true)} disabled={generandoCurso || horarios.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-2">
              {generandoCurso ? <><span className="animate-spin">⏳</span> Generando...</> : "📅 Generar curso completo"}
            </button>
          </div>
        </div>
      </div>

      {/* Filtro por terapeuta */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Filtrar por terapeuta:</span>
        <select value={filtroTer} onChange={e => setFiltroTer(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos</option>
          {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
        </select>
        <span className="text-xs text-gray-400">{horariosFiltrados.length} horarios</span>
      </div>

      {/* Lista de horarios agrupados por terapeuta */}
      {loading ? (
        <div className="text-gray-400 text-sm">Cargando...</div>
      ) : horarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 font-medium">No hay horarios habituales definidos</p>
          <p className="text-gray-300 text-sm mt-1">Añade los horarios de cada usuario para poder generar el mes automáticamente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(porTerapeuta).map(({ terapeuta, items }) => (
            <div key={terapeuta.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESPECIALIDAD_COLOR[terapeuta.especialidad] || "bg-gray-100 text-gray-600"}`}>
                  {ESPECIALIDAD_TITULO[terapeuta.especialidad] || terapeuta.especialidad}
                </span>
                <span className="font-semibold text-gray-700">{terapeuta.nombre} {terapeuta.apellidos}</span>
                <span className="text-xs text-gray-400 ml-auto">{items.length} horario{items.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="px-4 py-2 text-left">Día</th>
                    <th className="px-4 py-2 text-left">Usuario</th>
                    <th className="px-4 py-2 text-left">Servicio</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items
                    .sort((a, b) => a.diaSemana - b.diaSemana || a.usuario.apellidos.localeCompare(b.usuario.apellidos))
                    .map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {DIAS[h.diaSemana]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-800">{h.usuario.nombre} {h.usuario.apellidos}</td>
                      <td className="px-4 py-2.5 text-gray-500">{h.servicio.nombre}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setModalElim({ id: h.id, nombre: `${h.usuario.nombre} ${h.usuario.apellidos} — ${DIAS[h.diaSemana]}` })}
                          className="text-gray-300 hover:text-red-400 transition-colors text-sm">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmar generar mes */}
      {modalGen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800 mb-2">⚡ Generar sesiones de {MESES[mes-1]} {anio}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Se crearán sesiones en estado <strong>Programada</strong> para todos los usuarios activos según sus horarios habituales.
              Las sesiones que ya existan no se duplicarán.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalGen(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleGenerarMes}
                className="flex-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                Confirmar y generar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!modalElim}
        onClose={() => setModalElim(null)}
        onConfirm={handleDelete}
        type="eliminar"
        title="Eliminar horario habitual"
        message={
          <>
            ¿Eliminar el horario de <strong>{modalElim?.nombre}</strong>?
            <br />
            <span className="text-sm text-gray-400 mt-1 block">Las sesiones ya generadas no se verán afectadas.</span>
          </>
        }
        confirmText="Eliminar horario"
      />

      {/* Modal confirmar generar curso completo */}
      {modalCurso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Generar rango de meses</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Desde</label>
                <div className="flex gap-2">
                  <select value={cursoDesde.mes} onChange={e => setCursoDesde(f => ({...f, mes: Number(e.target.value)}))}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {MESES.map((m, i) => <option key={i+1} value={i+1}>{m.slice(0,3)}</option>)}
                  </select>
                  <select value={cursoDesde.anio} onChange={e => setCursoDesde(f => ({...f, anio: Number(e.target.value)}))}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {anios.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Hasta</label>
                <div className="flex gap-2">
                  <select value={cursoHasta.mes} onChange={e => setCursoHasta(f => ({...f, mes: Number(e.target.value)}))}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {MESES.map((m, i) => <option key={i+1} value={i+1}>{m.slice(0,3)}</option>)}
                  </select>
                  <select value={cursoHasta.anio} onChange={e => setCursoHasta(f => ({...f, anio: Number(e.target.value)}))}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {anios.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Se crearán sesiones en estado "Programada" para todos los usuarios activos según sus horarios habituales. Las sesiones existentes no se duplicarán.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalCurso(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleGenerarCurso}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
