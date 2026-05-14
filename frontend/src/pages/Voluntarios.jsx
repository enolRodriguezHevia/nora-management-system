import { useEffect, useState } from "react";
import { voluntariosService } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import AdvancedFilters from "../components/AdvancedFilters";
import { FormField } from "../components/FormField";
import { useResizableColumns } from "../hooks/useResizableColumns";
import { useTableSort, SortHeader } from "../hooks/useTableSort.jsx";
import RowMenu from "../components/RowMenu";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import { SkeletonTable } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { HeartIcon } from "@heroicons/react/24/outline";
import Pagination from "../components/Pagination";

const POR_PAGINA = 7;
const Field = FormField;

const EMPTY_FORM = {
  nombre: "", apellidos: "", dni: "",
  fechaNacimiento: "", telefono: "", email: "",
  direccion: "", poblacion: "", cp: "", provincia: "",
  fechaAlta: "", baja: false, fechaBaja: "",
  observaciones: "",
};

export default function Voluntarios() {
  const toast = useToast();
  const [voluntarios, setVoluntarios] = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [pagina, setPagina]           = useState(1);

  const [filtroEstado, setFiltroEstado]   = useState("activos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalBaja, setModalBaja]         = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  const { widths, getResizeHandleProps } = useResizableColumns({
    nombre: 200, dni: 110, telefono: 130, email: 180, alta: 100, estado: 90, acciones: 80,
  });

  const fetchVoluntarios = () => {
    setLoading(true);
    voluntariosService.getAll({ search: search || undefined })
      .then(r => setVoluntarios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVoluntarios(); setPagina(1); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (v) => {
    setEditing(v.id);
    const normalized = Object.fromEntries(
      Object.entries({ ...EMPTY_FORM, ...v }).map(([k, val]) => [k, val === null ? "" : val])
    );
    setForm({
      ...normalized,
      fechaNacimiento: v.fechaNacimiento ? v.fechaNacimiento.slice(0, 10) : "",
      fechaAlta:       v.fechaAlta       ? v.fechaAlta.slice(0, 10)       : "",
      fechaBaja:       v.fechaBaja       ? v.fechaBaja.slice(0, 10)       : "",
    });
    setModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      fechaNacimiento: form.fechaNacimiento || null,
      fechaAlta:       form.fechaAlta       || null,
      fechaBaja:       form.fechaBaja       || null,
    };
    try {
      if (editing) await voluntariosService.update(editing, payload);
      else         await voluntariosService.create(payload);
      setModal(false);
      fetchVoluntarios();
      toast.success(editing ? "Voluntario actualizado" : "Voluntario creado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBaja = async () => {
    if (!modalBaja) return;
    try {
      const payload = modalBaja.tipo === "baja"
        ? { baja: true,  fechaBaja: new Date().toISOString().slice(0, 10) }
        : { baja: false, fechaBaja: null };
      await voluntariosService.update(modalBaja.id, payload);
      setModalBaja(null);
      fetchVoluntarios();
      toast.success(modalBaja.tipo === "baja" ? "Voluntario dado de baja" : "Voluntario reactivado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!modalEliminar) return;
    try {
      await voluntariosService.delete(modalEliminar.id);
      setModalEliminar(null);
      fetchVoluntarios();
      toast.success("Voluntario eliminado");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const voluntariosFiltrados = voluntarios.filter(v => {
    if (filtroEstado === "activos" && v.baja)  return false;
    if (filtroEstado === "bajas"   && !v.baja) return false;
    return true;
  });

  const contadorFiltros = [filtroEstado !== "activos"].filter(Boolean).length;

  const customGetters = {
    nombre: (v) => `${v.nombre || ""} ${v.apellidos || ""}`.trim().toLowerCase(),
  };

  const { sorted: voluntariosOrdenados, sortKey, sortDir, toggleSort } =
    useTableSort(voluntariosFiltrados, "apellidos", "asc", customGetters);

  const voluntariosPagina = voluntariosOrdenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Voluntarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {voluntariosFiltrados.length} registros
            {contadorFiltros > 0 && ` (${voluntarios.length} total)`}
          </p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo voluntario
        </button>
      </div>

      <div className="mb-5">
        <input type="text" placeholder="Buscar por nombre, apellidos o DNI..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <AdvancedFilters
        isOpen={mostrarFiltros}
        onToggle={() => setMostrarFiltros(!mostrarFiltros)}
        activeCount={contadorFiltros}
        onClear={() => setFiltroEstado("activos")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1 font-medium">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="activos">Solo activos</option>
              <option value="bajas">Solo bajas</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </AdvancedFilters>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto w-full">
        <table className="text-sm" style={{ tableLayout: "fixed", minWidth: "100%", width: Object.values(widths).reduce((a, b) => a + b, 0) }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: "nombre",   label: "Nombre",    sortable: true },
                { key: "dni",      label: "DNI",       sortable: true },
                { key: "telefono", label: "Teléfono",  sortable: false },
                { key: "email",    label: "Email",     sortable: true },
                { key: "alta",     label: "Alta",      sortable: true, sortField: "fechaAlta" },
                { key: "estado",   label: "Estado",    sortable: true, sortField: "baja" },
                { key: "acciones", label: "",          sortable: false },
              ].map(({ key, label, sortable, sortField }) => (
                <th key={key} style={{ width: widths[key] }}
                  className="relative text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
                  {sortable
                    ? <SortHeader label={label} sortKey={sortField || key} currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                    : label}
                  <span {...getResizeHandleProps(key)}>
                    <span className="w-px h-4 bg-gray-300 group-hover:bg-blue-400 transition-colors" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="p-0"><SkeletonTable rows={5} cols={6} /></td></tr>
            ) : voluntariosOrdenados.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={HeartIcon}
                  title="No hay voluntarios"
                  description="Añade el primer voluntario con el botón + Nuevo voluntario"
                  isFiltered={contadorFiltros > 0}
                />
              </td></tr>
            ) : voluntariosPagina.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">{v.nombre} {v.apellidos}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{v.dni || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{v.telefono || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{v.email || "—"}</td>
                <td className="px-4 py-3 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                  {v.fechaAlta ? new Date(v.fechaAlta).toLocaleDateString("es-ES") : "—"}
                </td>
                <td className="px-4 py-3 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.baja ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {v.baja ? "Baja" : "Activo"}
                  </span>
                </td>
                <td className="px-4 py-3 overflow-hidden">
                  <RowMenu items={[
                    { label: "✏️ Editar", onClick: () => openEdit(v) },
                    "divider",
                    v.baja
                      ? { label: "✅ Reactivar",   onClick: () => setModalBaja({ id: v.id, nombre: `${v.nombre} ${v.apellidos}`, tipo: "reactivar" }), className: "text-green-600" }
                      : { label: "⏸ Dar de baja", onClick: () => setModalBaja({ id: v.id, nombre: `${v.nombre} ${v.apellidos}`, tipo: "baja" }), className: "text-orange-600" },
                    "divider",
                    { label: "🗑 Eliminar", onClick: () => setModalEliminar({ id: v.id, nombre: `${v.nombre} ${v.apellidos}` }), className: "text-red-600" },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 pb-3">
          <Pagination page={pagina} total={voluntariosOrdenados.length} perPage={POR_PAGINA} onChange={p => setPagina(p)} />
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "Editar voluntario" : "Nuevo voluntario"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre *"    name="nombre"    value={form.nombre}    onChange={handleChange} required />
                  <Field label="Apellidos *" name="apellidos" value={form.apellidos} onChange={handleChange} required />
                  <Field label="DNI"         name="dni"       value={form.dni}       onChange={handleChange} />
                  <Field label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
                  <Field label="Teléfono"    name="telefono"  value={form.telefono}  onChange={handleChange} />
                  <Field label="Email"       name="email"     type="email" value={form.email} onChange={handleChange} />
                  <Field label="Domicilio"   name="direccion" value={form.direccion} onChange={handleChange} className="col-span-2" />
                  <Field label="Población"   name="poblacion" value={form.poblacion} onChange={handleChange} />
                  <Field label="CP"          name="cp"        value={form.cp}        onChange={handleChange} />
                  <Field label="Provincia"   name="provincia" value={form.provincia} onChange={handleChange} />
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
                <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </section>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear voluntario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!modalBaja}
        onClose={() => setModalBaja(null)}
        onConfirm={handleBaja}
        type={modalBaja?.tipo}
        entityName={modalBaja?.nombre}
        entityType="voluntario"
      />
      <ConfirmModal
        isOpen={!!modalEliminar}
        onClose={() => setModalEliminar(null)}
        onConfirm={handleDelete}
        type="eliminar"
        entityName={modalEliminar?.nombre}
        entityType="voluntario"
      />
    </div>
  );
}
