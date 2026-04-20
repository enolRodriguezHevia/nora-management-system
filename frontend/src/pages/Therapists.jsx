import { useEffect, useState } from "react";
import { terapeutasService } from "../services/api";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";

// Alias para los campos de formulario
const Field = FormField;

const ESPECIALIDADES = ["Logopedia", "Psicología", "Fisioterapia", "Terapia Ocupacional"];

const ESPECIALIDAD_COLOR = {
  "Logopedia":           "bg-blue-100 text-blue-700",
  "Psicología":          "bg-purple-100 text-purple-700",
  "Fisioterapia":        "bg-green-100 text-green-700",
  "Terapia Ocupacional": "bg-orange-100 text-orange-700",
};

const EMPTY_FORM = { nombre: "", apellidos: "", especialidad: "", email: "", telefono: "", activo: true };

export default function Therapists() {
  const toast = useToast();
  const [terapeutas, setTerapeutas] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const fetch = () => {
    setLoading(true);
    terapeutasService.getAll().then(r => setTerapeutas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

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
      fetch();
      toast.success(editing ? "Terapeuta actualizado" : "Terapeuta creado correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Terapeutas</h1>
          <p className="text-gray-500 text-sm mt-1">{terapeutas.length} terapeutas activos</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo terapeuta
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {terapeutas.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">🩺</div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESPECIALIDAD_COLOR[t.especialidad] || "bg-gray-100 text-gray-600"}`}>
                  {t.especialidad}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t.nombre} {t.apellidos}</p>
                {t.email    && <p className="text-xs text-gray-500 mt-0.5">{t.email}</p>}
                {t.telefono && <p className="text-xs text-gray-500">{t.telefono}</p>}
              </div>
              <button onClick={() => openEdit(t)}
                className="mt-auto text-xs text-blue-600 hover:underline text-left">
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
