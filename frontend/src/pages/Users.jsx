import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usuariosService, sociosService } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import AdvancedFilters from "../components/AdvancedFilters";
import { FormField, BankField } from "../components/FormField";
import { useResizableColumns } from "../hooks/useResizableColumns";
import { useTableSort, SortHeader } from "../hooks/useTableSort.jsx";
import RowMenu from "../components/RowMenu";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import { SkeletonTable } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { UserGroupIcon } from "@heroicons/react/24/outline";

// Aliases para los campos de formulario
const Field = FormField;
const BField = BankField;

const EMPTY_FORM = {
  nombre: "", apellidos: "", dni: "", fechaNacimiento: "",
  direccion: "", poblacion: "", cp: "", provincia: "",
  telefono: "", telefono2: "", email: "",
  diagnostico: "", porcentajeDiscapacidad: "", grado: "", centroAlQueAcude: "",
  socioVinculadoId: "", socioVinculado2Id: "",
  fechaAlta: "", baja: false, fechaBaja: "", observaciones: "",
};

const EMPTY_BANCARIO = {
  entidadBancaria: "", iban: "", codigoEntidad: "",
  codigoSucursal: "", dc: "", numeroCuenta: "", observaciones: "",
};

export default function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [usuarios, setUsuarios]   = useState([]);
  const [socios, setSocios]       = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [bancario, setBancario]   = useState(EMPTY_BANCARIO);
  const [saving, setSaving]       = useState(false);
  
  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [filtroSocio, setFiltroSocio] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Modales de confirmación
  const [modalBaja, setModalBaja] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  const { widths, getResizeHandleProps } = useResizableColumns({
    id: 50, nombre: 180, dni: 110, telefono: 120, diagnostico: 200, alta: 100, estado: 90, acciones: 160,
  });

  const fetchUsuarios = () => {
    setLoading(true);
    usuariosService.getAll({ search: search || undefined })
      .then(r => setUsuarios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsuarios(); }, [search]);
  useEffect(() => { sociosService.getAll().then(r => setSocios(r.data)); }, []);

  // Abrir modal de edición si venimos de la ficha con editId
  useEffect(() => {
    const editId = location.state?.editId;
    if (!editId) return;
    // Limpiar el state para que no se reabra al navegar
    navigate("/usuarios", { replace: true, state: {} });
    usuariosService.getById(editId).then(r => openEdit(r.data));
  }, [location.state]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setBancario(EMPTY_BANCARIO); setModal(true); };
  const openEdit   = (u) => {
    setEditing(u.id);
    const normalized = Object.fromEntries(
      Object.entries({ ...EMPTY_FORM, ...u }).map(([k, v]) => [k, v === null ? "" : v])
    );
    setForm({
      ...normalized,
      fechaNacimiento: u.fechaNacimiento ? u.fechaNacimiento.slice(0, 10) : "",
      fechaAlta:       u.fechaAlta       ? u.fechaAlta.slice(0, 10)       : "",
      fechaBaja:       u.fechaBaja       ? u.fechaBaja.slice(0, 10)       : "",
      socioVinculadoId:  u.socioVinculadoId  ?? "",
      socioVinculado2Id: u.socioVinculado2Id ?? "",
    });
    const db = u.datosBancarios?.[0];
    const dbNorm = db
      ? Object.fromEntries(Object.entries({ ...EMPTY_BANCARIO, ...db }).map(([k, v]) => [k, v === null ? "" : v]))
      : EMPTY_BANCARIO;
    setBancario(dbNorm);
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
      porcentajeDiscapacidad: form.porcentajeDiscapacidad ? Number(form.porcentajeDiscapacidad) : null,
      socioVinculadoId:  form.socioVinculadoId  ? Number(form.socioVinculadoId)  : null,
      socioVinculado2Id: form.socioVinculado2Id ? Number(form.socioVinculado2Id) : null,
      fechaNacimiento: form.fechaNacimiento || null,
      fechaAlta:       form.fechaAlta       || null,
      fechaBaja:       form.fechaBaja       || null,
      datosBancarios: (bancario.iban || bancario.entidadBancaria) ? [bancario] : undefined,
    };
    try {
      if (editing) await usuariosService.update(editing, payload);
      else         await usuariosService.create(payload);
      setModal(false);
      fetchUsuarios();
      toast.success(editing ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err));
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
      await usuariosService.update(modalBaja.id, payload);
      setModalBaja(null);
      fetchUsuarios();
      toast.success(modalBaja.tipo === 'baja' ? "Usuario dado de baja" : "Usuario reactivado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!modalEliminar) return;
    try {
      await usuariosService.delete(modalEliminar.id);
      setModalEliminar(null);
      fetchUsuarios();
      toast.success("Usuario eliminado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Aplicar filtros locales
  const usuariosFiltrados = usuarios.filter(u => {
    // Filtro por estado
    if (filtroEstado === "activos" && u.baja) return false;
    if (filtroEstado === "bajas" && !u.baja) return false;
    if (filtroSocio && u.socioVinculadoId !== Number(filtroSocio)) return false;
    
    return true;
  });

  const contadorFiltros = [filtroEstado !== "activos", filtroSocio].filter(Boolean).length;
  const { sorted: usuariosOrdenados, sortKey, sortDir, toggleSort } = useTableSort(usuariosFiltrados, "apellidos");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuariosFiltrados.length} registros
            {contadorFiltros > 0 && ` (${usuarios.length} total)`}
          </p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo usuario
        </button>
      </div>

      {/* Búsqueda básica */}
      <div className="mb-5">
        <input
          type="text" placeholder="Buscar por nombre, apellidos o DNI..."
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
          setFiltroSocio("");
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Filtro por socio */}
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Socio vinculado</label>
            <select
              value={filtroSocio}
              onChange={e => setFiltroSocio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los socios</option>
              {socios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre} {s.apellidos}</option>
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
                { key: "id",          label: "ID",           sortable: true },
                { key: "nombre",      label: "Nombre",       sortable: true, sortField: "apellidos" },
                { key: "dni",         label: "DNI",          sortable: true },
                { key: "telefono",    label: "Teléfono",     sortable: false },
                { key: "diagnostico", label: "Diagnóstico",  sortable: true },
                { key: "alta",        label: "Alta",         sortable: true, sortField: "fechaAlta" },
                { key: "estado",      label: "Estado",       sortable: true, sortField: "baja" },
                { key: "acciones",    label: "Acciones",     sortable: false },
              ].map(({ key, label, sortable, sortField }) => (
                <th key={key} style={{ width: widths[key] }}
                  className="relative text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
                  {sortable ? (
                    <SortHeader label={label} sortKey={sortField || key} currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  ) : label}
                  <span {...getResizeHandleProps(key)}>
                    <span className="w-px h-4 bg-gray-300 group-hover:bg-blue-400 transition-colors" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="p-0">
                <SkeletonTable rows={6} cols={7} />
              </td></tr>
            ) : usuariosOrdenados.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState
                  icon={UserGroupIcon}
                  title="No hay usuarios"
                  description="Crea el primer usuario con el botón + Nuevo usuario"
                  isFiltered={contadorFiltros > 0}
                />
              </td></tr>
            ) : usuariosOrdenados.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">{u.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap" title={`${u.nombre} ${u.apellidos}`}>{u.nombre} {u.apellidos}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{u.dni || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{u.telefono || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap" title={u.diagnostico}>{u.diagnostico || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{u.fechaAlta ? new Date(u.fechaAlta).toLocaleDateString("es-ES") : "—"}</td>
                <td className="px-4 py-3 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.baja ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {u.baja ? "Baja" : "Activo"}
                  </span>
                </td>
                <td className="px-4 py-3 overflow-hidden">
                  <RowMenu items={[
                    { label: "👤 Ver ficha", onClick: () => navigate(`/usuarios/${u.id}`) },
                    { label: "✏️ Editar",    onClick: () => openEdit(u) },
                    "divider",
                    u.baja
                      ? { label: "✅ Reactivar",   onClick: () => setModalBaja({ id: u.id, nombre: `${u.nombre} ${u.apellidos}`, tipo: "reactivar" }), className: "text-green-600" }
                      : { label: "⏸ Dar de baja", onClick: () => setModalBaja({ id: u.id, nombre: `${u.nombre} ${u.apellidos}`, tipo: "baja" }), className: "text-orange-600" },
                    "divider",
                    { label: "🗑 Eliminar", onClick: () => setModalEliminar({ id: u.id, nombre: `${u.nombre} ${u.apellidos}` }), className: "text-red-600" },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "Editar usuario" : "Nuevo usuario"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Datos personales */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre *"    name="nombre"    value={form.nombre}    onChange={handleChange} required />
                  <Field label="Apellidos *" name="apellidos" value={form.apellidos} onChange={handleChange} required />
                  <Field label="DNI"         name="dni"       value={form.dni}       onChange={handleChange} />
                  <Field label="F. Nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
                  <Field label="Dirección"   name="direccion" value={form.direccion} onChange={handleChange} className="col-span-2" />
                  <Field label="Población"   name="poblacion" value={form.poblacion} onChange={handleChange} />
                  <Field label="CP"          name="cp"        value={form.cp}        onChange={handleChange} />
                  <Field label="Provincia"   name="provincia" value={form.provincia} onChange={handleChange} />
                  <Field label="Teléfono"    name="telefono"  value={form.telefono}  onChange={handleChange} />
                  <Field label="Teléfono 2"  name="telefono2" value={form.telefono2} onChange={handleChange} />
                  <Field label="Email"       name="email"     type="email" value={form.email} onChange={handleChange} className="col-span-2" />
                </div>
              </section>

              {/* Datos discapacidad */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos discapacidad</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Diagnóstico"      name="diagnostico"           value={form.diagnostico}           onChange={handleChange} className="col-span-2" />
                  <Field label="% Discapacidad"   name="porcentajeDiscapacidad" type="number" value={form.porcentajeDiscapacidad} onChange={handleChange} />
                  <Field label="Grado"            name="grado"                 value={form.grado}                 onChange={handleChange} />
                  <Field label="Centro al que acude" name="centroAlQueAcude"   value={form.centroAlQueAcude}      onChange={handleChange} className="col-span-2" />
                </div>
              </section>

              {/* Socios vinculados */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Socios vinculados</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Socio vinculado 1</label>
                    <select name="socioVinculadoId" value={form.socioVinculadoId} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sin socio —</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.numSocio} — {s.nombre} {s.apellidos}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Socio vinculado 2</label>
                    <select name="socioVinculado2Id" value={form.socioVinculado2Id} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sin socio —</option>
                      {socios.map(s => <option key={s.id} value={s.id}>{s.numSocio} — {s.nombre} {s.apellidos}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Alta / Baja */}
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

              {/* Observaciones */}
              <section>
                <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </section>

              {/* Datos bancarios */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos bancarios</h3>
                <div className="grid grid-cols-2 gap-3">
                  <BField label="Entidad bancaria" name="entidadBancaria" value={bancario.entidadBancaria} onChange={handleBancarioChange} className="col-span-2" />
                  <BField label="IBAN"             name="iban"            value={bancario.iban}            onChange={handleBancarioChange} className="col-span-2" />
                  <BField label="Código entidad"   name="codigoEntidad"   value={bancario.codigoEntidad}   onChange={handleBancarioChange} />
                  <BField label="Código sucursal"  name="codigoSucursal"  value={bancario.codigoSucursal}  onChange={handleBancarioChange} />
                  <BField label="DC"               name="dc"              value={bancario.dc}              onChange={handleBancarioChange} />
                  <BField label="Número de cuenta" name="numeroCuenta"    value={bancario.numeroCuenta}    onChange={handleBancarioChange} />
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
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}
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
        entityType="usuario"
      />

      <ConfirmModal
        isOpen={!!modalEliminar}
        onClose={() => setModalEliminar(null)}
        onConfirm={handleDelete}
        type="eliminar"
        entityName={modalEliminar?.nombre}
        entityType="usuario"
      />
    </div>
  );
}
