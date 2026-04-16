import { useEffect, useState } from "react";
import { sociosService } from "../services/api";

const TIPOLOGIAS    = ["Afectado", "Colaborador"];
const NOTIFICACIONES = ["Email", "Correo Postal"];
const CADENCIAS     = ["Mensual", "Trimestral", "Anual"];

const EMPTY_FORM = {
  numSocio: "", nombre: "", apellidos: "", dni: "",
  direccion: "", poblacion: "", cp: "", provincia: "",
  telefono: "", telefono2: "", email: "",
  tipologia: "", notificaciones: "", empresa: false,
  fechaAlta: "", baja: false, fechaBaja: "",
  referencias: "", observaciones: "",
};

const EMPTY_BANCARIO = {
  cadencia: "", cuota: "", entidadBancaria: "",
  iban: "", codigoEntidad: "", codigoSucursal: "",
  dc: "", numeroCuenta: "", observaciones: "",
};

export default function Socios() {
  const [socios, setSocios]   = useState([]);
  const [search, setSearch]   = useState("");
  const [showBaja, setShowBaja] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [bancario, setBancario] = useState(EMPTY_BANCARIO);
  const [saving, setSaving]   = useState(false);

  const fetchSocios = () => {
    setLoading(true);
    sociosService.getAll({ search: search || undefined, baja: showBaja })
      .then(r => setSocios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSocios(); }, [search, showBaja]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setBancario(EMPTY_BANCARIO); setModal(true); };
  const openEdit   = (s) => {
    setEditing(s.id);
    setForm({
      ...EMPTY_FORM, ...s,
      fechaAlta: s.fechaAlta ? s.fechaAlta.slice(0, 10) : "",
      fechaBaja: s.fechaBaja ? s.fechaBaja.slice(0, 10) : "",
    });
    // Cargar primer dato bancario si existe
    const db = s.datosBancarios?.[0];
    setBancario(db ? { ...EMPTY_BANCARIO, ...db } : EMPTY_BANCARIO);
    setModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleBancarioChange = (e) => {
    const { name, value } = e.target;
    setBancario(b => ({ ...b, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      numSocio: Number(form.numSocio),
      fechaAlta: form.fechaAlta || null,
      fechaBaja: form.fechaBaja || null,
      // Incluir datos bancarios si hay IBAN o entidad
      datosBancarios: (bancario.iban || bancario.entidadBancaria) ? [{ ...bancario, cuota: bancario.cuota ? Number(bancario.cuota) : null }] : undefined,
    };
    try {
      if (editing) await sociosService.update(editing, payload);
      else         await sociosService.create(payload);
      setModal(false);
      fetchSocios();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este socio?")) return;
    await sociosService.delete(id);
    fetchSocios();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Socios</h1>
          <p className="text-gray-500 text-sm mt-1">{socios.length} registros</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo socio
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Buscar por nombre, apellidos o DNI..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showBaja} onChange={e => setShowBaja(e.target.checked)} />
          Mostrar bajas
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Nº Socio", "Nombre", "DNI", "Teléfono", "Tipología", "Alta", "Estado", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : socios.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No hay socios</td></tr>
            ) : socios.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.numSocio}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.nombre} {s.apellidos}</td>
                <td className="px-4 py-3 text-gray-600">{s.dni || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.telefono || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.tipologia || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.fechaAlta ? new Date(s.fechaAlta).toLocaleDateString("es-ES") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.baja ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {s.baja ? "Baja" : "Activo"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "Editar socio" : "Nuevo socio"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nº Socio *" name="numSocio" type="number" value={form.numSocio} onChange={handleChange} required />
                  <Field label="DNI"        name="dni"      value={form.dni}      onChange={handleChange} />
                  <Field label="Nombre *"   name="nombre"   value={form.nombre}   onChange={handleChange} required />
                  <Field label="Apellidos *" name="apellidos" value={form.apellidos} onChange={handleChange} required />
                  <Field label="Dirección"  name="direccion" value={form.direccion} onChange={handleChange} className="col-span-2" />
                  <Field label="Población"  name="poblacion" value={form.poblacion} onChange={handleChange} />
                  <Field label="CP"         name="cp"        value={form.cp}        onChange={handleChange} />
                  <Field label="Provincia"  name="provincia" value={form.provincia} onChange={handleChange} />
                  <Field label="Teléfono"   name="telefono"  value={form.telefono}  onChange={handleChange} />
                  <Field label="Teléfono 2" name="telefono2" value={form.telefono2} onChange={handleChange} />
                  <Field label="Email"      name="email"     type="email" value={form.email} onChange={handleChange} className="col-span-2" />
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tipología</label>
                    <select name="tipologia" value={form.tipologia} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Seleccionar —</option>
                      {TIPOLOGIAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notificaciones</label>
                    <select name="notificaciones" value={form.notificaciones} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Seleccionar —</option>
                      {NOTIFICACIONES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" name="empresa" checked={form.empresa} onChange={handleChange} />
                    Es empresa
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Alta / Baja</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha de alta" name="fechaAlta" type="date" value={form.fechaAlta} onChange={handleChange} />
                  <Field label="Fecha de baja" name="fechaBaja" type="date" value={form.fechaBaja} onChange={handleChange} />
                  <label className="flex items-center gap-2 text-sm text-gray-700 col-span-2 cursor-pointer">
                    <input type="checkbox" name="baja" checked={form.baja} onChange={handleChange} />
                    Marcar como baja
                  </label>
                </div>
              </section>

              <section>
                <Field label="Referencias" name="referencias" value={form.referencias} onChange={handleChange} />
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </section>

              {/* Datos bancarios */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos bancarios</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cadencia</label>
                    <select name="cadencia" value={bancario.cadencia} onChange={handleBancarioChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Seleccionar —</option>
                      {CADENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <BField label="Cuota (€)"        name="cuota"           type="number" value={bancario.cuota}           onChange={handleBancarioChange} />
                  <BField label="Entidad bancaria"  name="entidadBancaria" value={bancario.entidadBancaria} onChange={handleBancarioChange} className="col-span-2" />
                  <BField label="IBAN"              name="iban"            value={bancario.iban}            onChange={handleBancarioChange} className="col-span-2" />
                  <BField label="Código entidad"    name="codigoEntidad"   value={bancario.codigoEntidad}   onChange={handleBancarioChange} />
                  <BField label="Código sucursal"   name="codigoSucursal"  value={bancario.codigoSucursal}  onChange={handleBancarioChange} />
                  <BField label="DC"                name="dc"              value={bancario.dc}              onChange={handleBancarioChange} />
                  <BField label="Número de cuenta"  name="numeroCuenta"    value={bancario.numeroCuenta}    onChange={handleBancarioChange} />
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Observaciones bancarias</label>
                    <textarea name="observaciones" value={bancario.observaciones} onChange={handleBancarioChange} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </section>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear socio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function BField({ label, name, value, onChange, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
