import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usuariosService } from "../services/api";
import { generarPDFFactura } from "../utils/pdfGenerator";
import { SkeletonFicha } from "../components/Skeleton";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const ESTADO_SESION = {
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

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function FichaUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabSesiones, setTabSesiones] = useState("recientes");

  useEffect(() => {
    usuariosService.getById(id)
      .then(r => setUsuario(r.data))
      .catch(() => navigate("/usuarios"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><SkeletonFicha /></div>;
  if (!usuario) return null;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("es-ES") : "—";
  const fmtEur = (n) => n != null ? `${Number(n).toFixed(2)} €` : "—";

  // Sesiones del mes actual
  const ahora = new Date();
  const sesionesMesActual = usuario.sesiones.filter(s => {
    const f = new Date(s.fecha);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });

  // Estadísticas de sesiones
  const totalSesiones = usuario.sesiones.length;
  const asistidas = usuario.sesiones.filter(s => s.estado === "asistio").length;
  const faltas = usuario.sesiones.filter(s => s.estado === "falta").length;
  const tasaAsistencia = totalSesiones > 0 ? Math.round((asistidas / (asistidas + faltas || 1)) * 100) : 0;

  // Estadísticas de facturas
  const totalFacturado = usuario.facturas.reduce((a, f) => a + f.total, 0);
  const facturasPendientes = usuario.facturas.filter(f => f.estado === "pendiente");
  const totalPendiente = facturasPendientes.reduce((a, f) => a + f.total, 0);

  const socio = usuario.socioVinculado;
  const iban = usuario.datosBancarios?.[0]?.iban;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/usuarios")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
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
        <button
          onClick={() => navigate("/usuarios", { state: { editId: usuario.id } })}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ✏️ Editar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sesiones totales", value: totalSesiones, icon: "📅", color: "blue" },
          { label: "Tasa asistencia", value: `${tasaAsistencia}%`, icon: "✅", color: "green" },
          { label: "Total facturado", value: fmtEur(totalFacturado), icon: "🧾", color: "purple" },
          { label: "Pendiente cobro", value: fmtEur(totalPendiente), icon: "⏳", color: totalPendiente > 0 ? "yellow" : "gray" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-xl font-bold text-gray-800">{k.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda */}
        <div className="space-y-5">
          {/* Datos personales */}
          <Section title="Datos personales" icon="👤">
            <div className="space-y-2">
              <InfoRow label="DNI / NIE" value={usuario.dni} />
              <InfoRow label="Fecha nacimiento" value={fmt(usuario.fechaNacimiento)} />
              <InfoRow label="Teléfono" value={usuario.telefono} />
              <InfoRow label="Teléfono 2" value={usuario.telefono2} />
              <InfoRow label="Email" value={usuario.email} />
              <InfoRow label="Dirección" value={usuario.direccion} />
              <InfoRow label="Población" value={usuario.poblacion} />
              <InfoRow label="CP" value={usuario.cp} />
              <InfoRow label="Provincia" value={usuario.provincia} />
              <InfoRow label="Centro" value={usuario.centroAlQueAcude} />
              <InfoRow label="Fecha alta" value={fmt(usuario.fechaAlta)} />
              {usuario.baja && <InfoRow label="Fecha baja" value={fmt(usuario.fechaBaja)} />}
            </div>
          </Section>

          {/* Datos clínicos */}
          <Section title="Datos clínicos" icon="🏥">
            <div className="space-y-2">
              <InfoRow label="Diagnóstico" value={usuario.diagnostico} />
              <InfoRow label="% Discapacidad" value={usuario.porcentajeDiscapacidad != null ? `${usuario.porcentajeDiscapacidad}%` : null} />
              <InfoRow label="Grado" value={usuario.grado} />
            </div>
            {!usuario.diagnostico && !usuario.grado && (
              <p className="text-sm text-gray-400">Sin datos clínicos registrados</p>
            )}
          </Section>

          {/* Socio vinculado */}
          <Section title="Socio vinculado" icon="🤝">
            {socio ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Nº {socio.numSocio}</span>
                  <span className="font-medium text-gray-800">{socio.nombre} {socio.apellidos}</span>
                </div>
                <InfoRow label="DNI" value={socio.dni} />
                <InfoRow label="Teléfono" value={socio.telefono} />
                <InfoRow label="Email" value={socio.email} />
                <InfoRow label="Tipología" value={socio.tipologia} />
                {socio.datosBancarios?.[0]?.iban && (
                  <InfoRow label="IBAN" value={socio.datosBancarios[0].iban} />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin socio vinculado</p>
            )}
            {usuario.socioVinculado2 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="text-xs text-gray-400 font-medium">Segundo socio</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Nº {usuario.socioVinculado2.numSocio}</span>
                  <span className="font-medium text-gray-800">{usuario.socioVinculado2.nombre} {usuario.socioVinculado2.apellidos}</span>
                </div>
              </div>
            )}
          </Section>

          {/* Datos bancarios */}
          {iban && (
            <Section title="Datos bancarios" icon="🏦">
              <div className="space-y-2">
                <InfoRow label="IBAN" value={iban} />
                <InfoRow label="Entidad" value={usuario.datosBancarios[0].entidadBancaria} />
              </div>
            </Section>
          )}

          {/* Observaciones */}
          {usuario.observaciones && (
            <Section title="Observaciones" icon="📝">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{usuario.observaciones}</p>
            </Section>
          )}
        </div>

        {/* Columna derecha (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sesiones del mes actual */}
          <Section title={`Sesiones — ${MESES[ahora.getMonth()]} ${ahora.getFullYear()}`} icon="📅">
            {sesionesMesActual.length === 0 ? (
              <p className="text-sm text-gray-400">Sin sesiones este mes</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3">Servicio</th>
                      <th className="pb-2 pr-3">Terapeuta</th>
                      <th className="pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sesionesMesActual.map(s => (
                      <tr key={s.id}>
                        <td className="py-1.5 pr-3 text-gray-600">{new Date(s.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}</td>
                        <td className="py-1.5 pr-3 text-gray-800">{s.servicio?.nombre}</td>
                        <td className="py-1.5 pr-3 text-gray-600">{s.terapeuta?.nombre} {s.terapeuta?.apellidos}</td>
                        <td className="py-1.5"><Badge estado={s.estado} map={ESTADO_SESION} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Historial de sesiones */}
          <Section title="Historial de sesiones" icon="📊">
            <div className="flex gap-2 mb-4">
              {["recientes", "stats"].map(t => (
                <button key={t} onClick={() => setTabSesiones(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${tabSesiones === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {t === "recientes" ? "Últimas sesiones" : "Por servicio"}
                </button>
              ))}
            </div>

            {tabSesiones === "recientes" ? (
              <div className="overflow-x-auto">
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
                    {usuario.sesiones.slice(0, 20).map(s => (
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
                {usuario.sesiones.length > 20 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">Mostrando las 20 más recientes de {usuario.sesiones.length} totales</p>
                )}
              </div>
            ) : (
              // Agrupado por servicio
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
                    <span className="text-gray-500 text-xs w-20 text-right">{stats.asistidas} asist. / {stats.faltas} faltas</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Facturas */}
          <Section title="Historial de facturas" icon="🧾">
            {usuario.facturas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin facturas generadas</p>
            ) : (
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
                  {usuario.facturas.map(f => (
                    <tr key={f.id}>
                      <td className="py-2 pr-3 font-mono text-xs text-gray-700">{f.numRecibo}</td>
                      <td className="py-2 pr-3 text-gray-600">{MESES[f.mes - 1]} {f.anio}</td>
                      <td className="py-2 pr-3 text-gray-600">{fmtEur(f.subtotal)}</td>
                      <td className="py-2 pr-3 text-red-500">{f.descuento > 0 ? `-${fmtEur(f.descuento)}` : "—"}</td>
                      <td className="py-2 pr-3 font-semibold text-gray-800">{fmtEur(f.total)}</td>
                      <td className="py-2 pr-3"><Badge estado={f.estado} map={ESTADO_FACTURA} /></td>
                      <td className="py-2">
                        <button onClick={() => generarPDFFactura({ ...f, usuario })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          📄 PDF
                        </button>
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
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
