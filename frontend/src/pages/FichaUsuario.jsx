import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usuariosService, avisosService } from "../services/api";
import { generarPDFFactura } from "../utils/pdfGenerator";
import { SkeletonFicha } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Section, InfoRow } from "../components/FichaSection";
import { MESES, MESES_CORTOS } from "../utils/constants.js";
import Pagination from "../components/Pagination";

const MESES_ABREV = MESES_CORTOS;
const POR_PAGINA  = 15;

const ESTADO_SESION = {
  programada:           { label: "Programada",    color: "bg-slate-100 text-slate-600" },
  asistio:              { label: "Asistió",       color: "bg-green-100 text-green-800" },
  falta:                { label: "Falta",          color: "bg-red-100 text-red-800" },
  festivo:              { label: "Festivo",        color: "bg-gray-100 text-gray-600" },
  vacaciones_terapeuta: { label: "Vac. terapeuta", color: "bg-yellow-100 text-yellow-800" },
  permiso:              { label: "Permiso",        color: "bg-orange-100 text-orange-800" },
  hospitalizacion:      { label: "Hospitalización",color: "bg-purple-100 text-purple-800" },
};
const ESTADO_FACTURA = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  cobrada:   { label: "Cobrada",   color: "bg-green-100 text-green-800" },
  anulada:   { label: "Anulada",   color: "bg-red-100 text-red-800" },
};

function Badge({ estado, map }) {
  const cfg = map[estado] ?? { label: estado, color: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>;
}

function Tab({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
      {badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function FichaUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();

  const backUrl = isAdmin ? "/usuarios" : "/sesiones";
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("resumen");
  const [tabSesiones, setTabSesiones] = useState("recientes");
  const [nuevoAviso, setNuevoAviso]   = useState("");
  const [savingAviso, setSavingAviso] = useState(false);
  const [pagSesiones, setPagSesiones] = useState(1);
  const [pagFacturas, setPagFacturas] = useState(1);

  useEffect(() => {
    usuariosService.getById(id)
      .then(r => setUsuario(r.data))
      .catch(() => navigate(backUrl))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><SkeletonFicha /></div>;
  if (!usuario) return null;

  const fmt    = (d) => d ? new Date(d).toLocaleDateString("es-ES") : "—";
  const fmtEur = (n) => n != null ? `${Number(n).toFixed(2)} €` : "—";
  const recargar = () => usuariosService.getById(id).then(r => setUsuario(r.data));

  const handleAddAviso = async () => {
    if (!nuevoAviso.trim()) return;
    setSavingAviso(true);
    try {
      await avisosService.create({ usuarioId: Number(id), texto: nuevoAviso.trim() });
      setNuevoAviso("");
      await recargar();
      toast.success("Aviso añadido");
    } catch { toast.error("Error al añadir aviso"); }
    finally { setSavingAviso(false); }
  };

  const handleToggleAviso = async (aviso) => {
    try { await avisosService.update(aviso.id, { resuelto: !aviso.resuelto }); await recargar(); }
    catch { toast.error("Error al actualizar aviso"); }
  };

  const handleDeleteAviso = async (avisoId) => {
    try { await avisosService.delete(avisoId); await recargar(); toast.success("Aviso eliminado"); }
    catch { toast.error("Error al eliminar aviso"); }
  };

  const ahora = new Date();
  const totalSesiones  = usuario.sesiones.length;
  const asistidas      = usuario.sesiones.filter(s => s.estado === "asistio").length;
  const faltas         = usuario.sesiones.filter(s => s.estado === "falta").length;
  const tasaAsistencia = totalSesiones > 0 ? Math.round((asistidas / (asistidas + faltas || 1)) * 100) : 0;
  const totalFacturado = usuario.facturas.reduce((a, f) => a + f.total, 0);
  const totalPendiente = usuario.facturas.filter(f => f.estado === "pendiente").reduce((a, f) => a + f.total, 0);
  const avisosActivos  = (usuario.avisos || []).filter(a => !a.resuelto).length;
  const socio          = usuario.socioVinculado;
  const iban           = usuario.datosBancarios?.[0]?.iban;

  const tabs = [
    { key: "resumen",  label: "Resumen" },
    { key: "sesiones", label: "Sesiones", badge: totalSesiones },
    ...(isAdmin ? [
      { key: "facturas", label: "Facturas", badge: usuario.facturas.length },
      { key: "avisos",   label: "Avisos",   badge: avisosActivos },
    ] : []),
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(backUrl)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{usuario.nombre} {usuario.apellidos}</h1>
            <div className="flex items-center gap-3 mt-1">
              {usuario.baja
                ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Baja</span>
                : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>
              }
              {usuario.diagnostico && <span className="text-sm text-gray-500">{usuario.diagnostico}</span>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => navigate("/usuarios", { state: { editId: usuario.id } })}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ✏️ Editar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sesiones totales", value: totalSesiones,       icon: "📅" },
          { label: "Tasa asistencia",  value: `${tasaAsistencia}%`, icon: "✅" },
          ...(isAdmin ? [
            { label: "Total facturado", value: fmtEur(totalFacturado), icon: "🧾" },
            { label: "Pendiente cobro", value: fmtEur(totalPendiente), icon: "⏳" },
          ] : []),
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xl mb-1">{k.icon}</div>
            <div className="text-xl font-bold text-gray-800">{k.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-4">
          {tabs.map(t => (
            <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} badge={t.badge} />
          ))}
        </div>

        <div className="p-5">
          {/* ── TAB RESUMEN ── */}
          {tab === "resumen" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <Section title="Datos personales" icon="👤">
                  <div className="space-y-2">
                    <InfoRow label="DNI / NIE"        value={usuario.dni} />
                    <InfoRow label="Fecha nacimiento" value={fmt(usuario.fechaNacimiento)} />
                    <InfoRow label="Teléfono"         value={usuario.telefono} />
                    <InfoRow label="Teléfono 2"       value={usuario.telefono2} />
                    <InfoRow label="Email"            value={usuario.email} />
                    <InfoRow label="Dirección"        value={usuario.direccion} />
                    <InfoRow label="Población"        value={usuario.poblacion} />
                    <InfoRow label="CP"               value={usuario.cp} />
                    <InfoRow label="Centro"           value={usuario.centroAlQueAcude} />
                    <InfoRow label="Fecha alta"       value={fmt(usuario.fechaAlta)} />
                    {usuario.baja && <InfoRow label="Fecha baja" value={fmt(usuario.fechaBaja)} />}
                  </div>
                </Section>

                <Section title="Datos clínicos" icon="🏥">
                  <div className="space-y-2">
                    <InfoRow label="Diagnóstico"      value={usuario.diagnostico} />
                    <InfoRow label="% Discapacidad"   value={usuario.porcentajeDiscapacidad != null ? `${usuario.porcentajeDiscapacidad}%` : null} />
                    <InfoRow label="Grado"            value={usuario.grado} />
                  </div>
                  {!usuario.diagnostico && !usuario.grado && <p className="text-sm text-gray-400">Sin datos clínicos</p>}
                </Section>
              </div>

              <div className="space-y-4">
                <Section title="Socio vinculado" icon="🤝">
                  {socio ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Nº {socio.numSocio}</span>
                        <span className="font-medium text-gray-800">{socio.nombre} {socio.apellidos}</span>
                      </div>
                      <InfoRow label="DNI"       value={socio.dni} />
                      <InfoRow label="Teléfono"  value={socio.telefono} />
                      <InfoRow label="Email"     value={socio.email} />
                      <InfoRow label="Tipología" value={socio.tipologia} />
                    </div>
                  ) : <p className="text-sm text-gray-400">Sin socio vinculado</p>}
                  {usuario.socioVinculado2 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-xs text-gray-400 font-medium">Segundo socio</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Nº {usuario.socioVinculado2.numSocio}</span>
                        <span className="font-medium text-gray-800">{usuario.socioVinculado2.nombre} {usuario.socioVinculado2.apellidos}</span>
                      </div>
                    </div>
                  )}
                </Section>

                {iban && isAdmin && (
                  <Section title="Datos bancarios" icon="🏦">
                    <div className="space-y-2">
                      <InfoRow label="IBAN"    value={iban} />
                      <InfoRow label="Entidad" value={usuario.datosBancarios[0].entidadBancaria} />
                    </div>
                  </Section>
                )}

                {usuario.observaciones && (
                  <Section title="Observaciones" icon="📝">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{usuario.observaciones}</p>
                  </Section>
                )}
              </div>
            </div>
          )}

          {/* ── TAB SESIONES ── */}
          {tab === "sesiones" && (
            <div className="space-y-5">
              {/* Historial */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600">Historial de sesiones</h3>
                  <div className="flex gap-2">
                    {["recientes", "stats"].map(t => (
                      <button key={t} onClick={() => { setTabSesiones(t); setPagSesiones(1); }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${tabSesiones === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {t === "recientes" ? "Lista" : "Por servicio"}
                      </button>
                    ))}
                  </div>
                </div>

                {tabSesiones === "recientes" ? (
                  <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Servicio</th>
                        <th className="pb-2 pr-3">Terapeuta</th>
                        <th className="pb-2 pr-3">Estado</th>
                        <th className="pb-2">Actividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {usuario.sesiones.slice((pagSesiones-1)*POR_PAGINA, pagSesiones*POR_PAGINA).map(s => (
                        <tr key={s.id}>
                          <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{fmt(s.fecha)}</td>
                          <td className="py-1.5 pr-3 text-gray-800">{s.servicio?.nombre}</td>
                          <td className="py-1.5 pr-3 text-gray-600">{s.terapeuta?.nombre}</td>
                          <td className="py-1.5 pr-3"><Badge estado={s.estado} map={ESTADO_SESION} /></td>
                          <td className="py-1.5 text-gray-500 text-xs max-w-[160px] truncate" title={s.actividadRealizada}>{s.actividadRealizada || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={pagSesiones} total={usuario.sesiones.length} perPage={POR_PAGINA} onChange={p => { setPagSesiones(p); }} />
                  </>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      usuario.sesiones.reduce((acc, s) => {
                        const k = s.servicio?.nombre || "Desconocido";
                        if (!acc[k]) acc[k] = { total: 0, asistidas: 0, faltas: 0 };
                        acc[k].total++;
                        if (s.estado === "asistio") acc[k].asistidas++;
                        if (s.estado === "falta") acc[k].faltas++;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1].total - a[1].total).map(([nombre, stats]) => (
                      <div key={nombre} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-700 w-44 truncate" title={nombre}>{nombre}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, stats.total * 5)}%` }} />
                        </div>
                        <span className="text-gray-500 text-xs w-24 text-right">{stats.asistidas} asist. / {stats.faltas} faltas</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB FACTURAS (solo admin) ── */}
          {tab === "facturas" && isAdmin && (
            <div>
              {usuario.facturas.length === 0 ? (
                <p className="text-sm text-gray-400">Sin facturas generadas</p>
              ) : (
                <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-3">Nº Recibo</th>
                      <th className="pb-2 pr-3">Período</th>
                      <th className="pb-2 pr-3">Subtotal</th>
                      <th className="pb-2 pr-3">Descuento</th>
                      <th className="pb-2 pr-3">Total</th>
                      <th className="pb-2 pr-3">Estado</th>
                      <th className="pb-2">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usuario.facturas.slice((pagFacturas-1)*POR_PAGINA, pagFacturas*POR_PAGINA).map(f => (
                      <tr key={f.id}>
                        <td className="py-2 pr-3 font-mono text-xs text-gray-700">{f.numRecibo}</td>
                        <td className="py-2 pr-3 text-gray-600">{MESES[f.mes - 1]} {f.anio}</td>
                        <td className="py-2 pr-3 text-gray-600">{fmtEur(f.subtotal)}</td>
                        <td className="py-2 pr-3 text-red-500">{f.descuento > 0 ? `-${fmtEur(f.descuento)}` : "—"}</td>
                        <td className="py-2 pr-3 font-semibold text-gray-800">{fmtEur(f.total)}</td>
                        <td className="py-2 pr-3"><Badge estado={f.estado} map={ESTADO_FACTURA} /></td>
                        <td className="py-2">
                          <button onClick={() => generarPDFFactura({ ...f, usuario })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">📄 PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="pt-2 text-xs text-gray-400 font-medium text-right pr-3">TOTAL FACTURADO</td>
                      <td className="pt-2 font-bold text-gray-800">{fmtEur(totalFacturado)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
                <Pagination page={pagFacturas} total={usuario.facturas.length} perPage={POR_PAGINA} onChange={p => setPagFacturas(p)} />
                </>
              )}
            </div>
          )}

          {/* ── TAB AVISOS (solo admin) ── */}
          {tab === "avisos" && isAdmin && (
            <div className="space-y-3">
              {(usuario.avisos || []).length === 0 && (
                <p className="text-sm text-gray-400">Sin avisos registrados</p>
              )}
              {(usuario.avisos || []).map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${a.resuelto ? "bg-gray-50 border-gray-100 opacity-60" : "bg-amber-50 border-amber-100"}`}>
                  <button onClick={() => handleToggleAviso(a)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${a.resuelto ? "bg-green-500 border-green-500 text-white" : "border-amber-400 hover:bg-amber-100"}`}>
                    {a.resuelto && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${a.resuelto ? "line-through text-gray-400" : "text-gray-800"}`}>{a.texto}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(a.createdAt)}</p>
                  </div>
                  <button onClick={() => handleDeleteAviso(a.id)} className="text-gray-300 hover:text-red-400 transition-colors text-sm">✕</button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" value={nuevoAviso} onChange={e => setNuevoAviso(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddAviso()}
                  placeholder="Escribe un aviso y pulsa Enter..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleAddAviso} disabled={savingAviso || !nuevoAviso.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                  Añadir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
