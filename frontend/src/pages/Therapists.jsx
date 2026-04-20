import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { terapeutasService, sesionesService } from "../services/api";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import { SkeletonCard } from "../components/Skeleton";
import { HeartIcon } from "@heroicons/react/24/outline";

const Field = FormField;
const ESPECIALIDADES = ["Logopedia", "Psicología", "Fisioterapia", "Terapia Ocupacional"];
const ESPECIALIDAD_COLOR = {
  "Logopedia":           "bg-blue-100 text-blue-700 border-blue-200",
  "Psicología":          "bg-purple-100 text-purple-700 border-purple-200",
  "Fisioterapia":        "bg-green-100 text-green-700 border-green-200",
  "Terapia Ocupacional": "bg-orange-100 text-orange-700 border-orange-200",
};
const EMPTY_FORM = { nombre: "", apellidos: "", especialidad: "", email: "", telefono: "", activo: true };

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function TerapeutaCard({ t, mes, anio, onEdit, onVerSesiones }) {
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    sesionesService.metricasTerapeuta(t.id, mes, anio)
      .then(r => setMetricas(r.data))
      .catch(() => setMetricas(null));
  }, [t.id, mes, anio]);

  const colorClass = ESPECIALIDAD_COLOR[t.especialidad] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <HeartIcon className="w-5 h-5 text-slate-500" />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
          {t.especialidad}
        </span>
      </div>

      {/* Nombre */}
      <div>
        <p className="font-semibold text-gray-800">{t.nombre} {t.apellidos}</p>
        {t.email    && <p className="text-xs text-gray-400 mt-0.5">{t.email}</p>}
        {t.telefono && <p className="text-xs text-gray-400">{t.telefono}</p>}
      </div>

      {/* Métricas del mes */}
      {metricas ? (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{metricas.total}</p>
            <p className="text-xs text-gray-400">Sesiones</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{metricas.pctAsistencia}%</p>
            <p className="text-xs text-gray-400">Asistencia</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{metricas.cobrables}</p>
            <p className="text-xs text-gray-400">Cobrables</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${metricas.programadas > 0 ? "text-amber-500" : "text-gray-300"}`}>
              {metricas.programadas}
            </p>
            <p className="text-xs text-gray-400">Programadas</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => onVerSesiones(t.id)}
          className="flex-1 text-xs text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors font-medium">
          Ver sesiones
        </button>
        <button onClick={() => onEdit(t)}
          className="flex-1 text-xs text-gray-500 hover:bg-gray-50 py-1.5 rounded-lg transition-colors">
          Editar
        </button>
      </div>
    </div>
  );
}

export default function Therapists() {
  const toast = useToast();
  const navigate = useNavigate();
  const now = new Date();
  const [mes,  setMes]  = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [terapeutas, setTerapeutas] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const fetchTerapeutas = () => {
    setLoading(true);
    terapeutasService.getAll().then(r => setTerapeutas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTerapeutas(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit   = (t) => { setEditing(t.id); setForm({ ...EMPTY_FORM, ...t }); setModal(true); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await terapeutasService.update(editing, form);
      else         await terapeutasService.create(form);
      setModal(false);
      fetchTerapeutas();
      toast.success(editing ? "Terapeuta actualizado" : "Terapeuta creado correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const anios = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Terapeutas</h1>
          <p className="text-gray-500 text-sm mt-1">{terapeutas.length} terapeutas activos</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo terapeuta
        </button>
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 w-fit">
        <span className="text-sm text-gray-500 font-medium">Métricas de</span>
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tarjetas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {terapeutas.map(t => (
            <TerapeutaCard
              key={t.id}
              t={t}
              mes={mes}
              anio={anio}
              onEdit={openEdit}
              onVerSesiones={(id) => navigate(`/sesiones?terapeutaId=${id}`)}
            />
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "Editar terapeuta" : "Nuevo terapeuta"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Field label="Nombre *"    name="nombre"    value={form.nombre}    onChange={handleChange} required />
              <Field label="Apellidos *" name="apellidos" value={form.apellidos} onChange={handleChange} required />
              <div>
                <label className="block text-xs text-gray-600 mb-1">Especialidad *</label>
                <select name="especialidad" value={form.especialidad} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Seleccionar —</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <Field label="Email"    name="email"    type="email" value={form.email}    onChange={handleChange} />
              <Field label="Teléfono" name="telefono"             value={form.telefono} onChange={handleChange} />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Activo
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {saving ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
