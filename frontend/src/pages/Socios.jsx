import { useEffect, useState } from "react";
import { sociosService } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import AdvancedFilters from "../components/AdvancedFilters";
import { FormField, BankField } from "../components/FormField";
import { useResizableColumns } from "../hooks/useResizableColumns";

// Aliases para los campos de formulario
const Field = FormField;
const BField = BankField;

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
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [bancario, setBancario] = useState(EMPTY_BANCARIO);
  const [saving, setSaving]   = useState(false);
  
  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [filtroTipologia, setFiltroTipologia] = useState("");
  const [filtroPoblacion, setFiltroPoblacion] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Modales de confirmación
  const [modalBaja, setModalBaja] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  const { widths, getResizeHandleProps } = useResizableColumns({
    numSocio: 80, nombre: 180, dni: 110, telefono: 120, tipologia: 120, alta: 100, estado: 90, acciones: 160,
  });

  const fetchSocios = () => {
    setLoading(true);
    sociosService.getAll({ search: search || undefined })
      .then(r => setSocios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSocios(); }, [search]);

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

  const handleBaja = async () => {
    if (!modalBaja) return;
    try {
      const payload = modalBaja.tipo === 'baja' 
        ? { baja: true, fechaBaja: new Date().toISOString().slice(0, 10) }
        : { baja: false, fechaBaja: null };
      await sociosService.update(modalBaja.id, payload);
      setModalBaja(null);
      fetchSocios();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    if (!modalEliminar) return;
    try {
      await sociosService.delete(modalEliminar.id);
      setModalEliminar(null);
      fetchSocios();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  // Aplicar filtros locales
  const sociosFiltrados = socios.filter(s => {
    // Filtro por estado
    if (filtroEstado === "activos" && s.baja) return false;
    if (filtroEstado === "bajas" && !s.baja) return false;
    
    // Filtro por tipología
    if (filtroTipologia && s.tipologia !== filtroTipologia) return false;
    
    // Filtro por población
    if (filtroPoblacion && s.poblacion !== filtroPoblacion) return false;
    
    return true;
  });

  // Obtener poblaciones únicas para el filtro
  const poblacionesUnicas = [...new Set(socios.map(s => s.poblacion).filter(Boolean))];
  
  const contadorFiltros = [
    filtroEstado !== "activos",
    filtroTipologia,
    filtroPoblacion
  ].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Socios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sociosFiltrados.length} registros
            {contadorFiltros > 0 && ` (${socios.length} total)`}
          </p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo socio
        </button>
      </div>

      {/* Búsqueda básica */}
      <div className="mb-5">
        <input type="text" placeholder="Buscar por nombre, apellidos o DNI..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtros avanzados */}
      <AdvancedFilters
        isOpen={mostrarFiltros}
        onToggle={() => setMostrarFiltros(!mostrarFiltros)}
        activeCount={contadorFiltros}
        onClear={() => {
          setFiltroEstado("activos");
          setFiltroTipologia("");
          setFiltroPoblacion("");
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="activos">Solo activos</option>
              <option value="bajas">Solo bajas</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {/* Filtro por tipología */}
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Tipología</label>
            <select
              value={filtroTipologia}
              onChange={e => setFiltroTipologia(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las tipologías</option>
              {TIPOLOGIAS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro por población */}
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Población</label>
            <select
              value={filtroPoblacion}
              onChange={e => setFiltroPoblacion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las poblaciones</option>
              {poblacionesUnicas.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </AdvancedFilters>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto w-full">
        <table className="text-sm" style={{ tableLayout: "fixed", minWidth: "100%", width: Object.values(widths).reduce((a, b) => a + b, 0) }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: "numSocio",  label: "Nº Socio" },
                { key: "nombre",    label: "Nombre" },
                { key: "dni",       label: "DNI" },
                { key: "telefono",  label: "Teléfono" },
                { key: "tipologia", label: "Tipología" },
                { key: "alta",      label: "Alta" },
                { key: "estado",    label: "Estado" },
                { key: "acciones",  label: "" },
              ].map(({ key, label }) => (
                <th key={key} style={{ width: widths[key] }}
                  className="relative text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
                  {label}
                  <span {...getResizeHandleProps(key)}>
                    <span className="w-px h-4 bg-gray-300 group-hover:bg-blue-400 transition-colors" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : sociosFiltrados.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                {contadorFiltros > 0 ? "No hay socios que coincidan con los filtros" : "No hay socios"}
              </td></tr>
            ) : sociosFiltrados.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">{s.numSocio}</td>
                <td className="px-4 py-3 font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap" title={`${s.nombre} ${s.apellidos}`}>{s.nombre} {s.apellidos}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{s.dni || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{s.telefono || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{s.tipologia || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{s.fechaAlta ? new Date(s.fechaAlta).toLocaleDateString("es-ES") : "—"}</td>
                <td className="px-4 py-3 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.baja ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {s.baja ? "Baja" : "Activo"}
                  </span>
                </td>
                <td className="px-4 py-3 overflow-hidden">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    {s.baja ? (
                      <button onClick={() => setModalBaja({ id: s.id, nombre: `${s.nombre} ${s.apellidos}`, tipo: 'reactivar' })} className="text-green-600 hover:underline text-xs">Reactivar</button>
                    ) : (
                      <button onClick={() => setModalBaja({ id: s.id, nombre: `${s.nombre} ${s.apellidos}`, tipo: 'baja' })} className="text-orange-600 hover:underline text-xs">Dar de baja</button>
                    )}
                    <button onClick={() => setModalEliminar({ id: s.id, nombre: `${s.nombre} ${s.apellidos}` })} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </div>
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

      {/* Modales de confirmación */}
      <ConfirmModal
        isOpen={!!modalBaja}
        onClose={() => setModalBaja(null)}
        onConfirm={handleBaja}
        type={modalBaja?.tipo}
        entityName={modalBaja?.nombre}
        entityType="socio"
      />

      <ConfirmModal
        isOpen={!!modalEliminar}
        onClose={() => setModalEliminar(null)}
        onConfirm={handleDelete}
        type="eliminar"
        entityName={modalEliminar?.nombre}
        entityType="socio"
      />
    </div>
  );
}
