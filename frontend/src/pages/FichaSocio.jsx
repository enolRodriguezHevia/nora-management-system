import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sociosService } from "../services/api";
import { SkeletonFicha } from "../components/Skeleton";

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

export default function FichaSocio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sociosService.getById(id)
      .then(r => setSocio(r.data))
      .catch(() => navigate("/socios"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><SkeletonFicha /></div>;
  if (!socio) return null;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("es-ES") : "—";
  const fmtEur = (n) => n != null ? `${Number(n).toFixed(2)} €` : "—";
  const banc = socio.datosBancarios?.[0];
  const usuarios = [...(socio.usuariosVinculados || []), ...(socio.usuariosVinculados2 || [])];
  // Deduplicar por id
  const usuariosUnicos = usuarios.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/socios")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono font-medium">Nº {socio.numSocio}</span>
              {socio.tipologia && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{socio.tipologia}</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">{socio.nombre} {socio.apellidos}</h1>
            <div className="flex items-center gap-2 mt-1">
              {socio.baja
                ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Baja</span>
                : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>
              }
              {socio.empresa && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Empresa</span>}
            </div>
          </div>
        </div>
        <button onClick={() => navigate("/socios", { state: { editId: socio.id } })} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ✏️ Editar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-xl font-bold text-gray-800">{usuariosUnicos.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Usuarios vinculados</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl mb-1">💶</div>
          <div className="text-xl font-bold text-gray-800">{banc?.cuota ? fmtEur(banc.cuota) : "—"}</div>
          <div className="text-xs text-gray-400 mt-0.5">Cuota {banc?.cadencia?.toLowerCase() || ""}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-xl font-bold text-gray-800">{fmt(socio.fechaAlta)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Fecha de alta</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos personales */}
        <Section title="Datos personales" icon="👤">
          <div className="space-y-2">
            <InfoRow label="DNI / CIF"      value={socio.dni} />
            <InfoRow label="Teléfono"        value={socio.telefono} />
            <InfoRow label="Teléfono 2"      value={socio.telefono2} />
            <InfoRow label="Email"           value={socio.email} />
            <InfoRow label="Dirección"       value={socio.direccion} />
            <InfoRow label="Población"       value={socio.poblacion} />
            <InfoRow label="CP"              value={socio.cp} />
            <InfoRow label="Provincia"       value={socio.provincia} />
            <InfoRow label="Notificaciones"  value={socio.notificaciones} />
            <InfoRow label="Referencias"     value={socio.referencias} />
            {socio.baja && <InfoRow label="Fecha baja" value={fmt(socio.fechaBaja)} />}
          </div>
        </Section>

        {/* Datos bancarios */}
        <div className="space-y-5">
          <Section title="Datos bancarios" icon="🏦">
            {banc ? (
              <div className="space-y-2">
                <InfoRow label="IBAN"            value={banc.iban} />
                <InfoRow label="Entidad"         value={banc.entidadBancaria} />
                <InfoRow label="Cadencia"        value={banc.cadencia} />
                <InfoRow label="Cuota"           value={banc.cuota ? fmtEur(banc.cuota) : null} />
                <InfoRow label="Cód. entidad"    value={banc.codigoEntidad} />
                <InfoRow label="Cód. sucursal"   value={banc.codigoSucursal} />
                <InfoRow label="DC"              value={banc.dc} />
                <InfoRow label="Nº cuenta"       value={banc.numeroCuenta} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos bancarios registrados</p>
            )}
          </Section>

          {socio.observaciones && (
            <Section title="Observaciones" icon="📝">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{socio.observaciones}</p>
            </Section>
          )}
        </div>
      </div>

      {/* Usuarios vinculados */}
      <Section title="Usuarios vinculados" icon="🧑‍🦽">
        {usuariosUnicos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin usuarios vinculados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usuariosUnicos.map(u => (
              <button
                key={u.id}
                onClick={() => navigate(`/usuarios/${u.id}`)}
                className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 group-hover:text-blue-700">
                    {u.nombre} {u.apellidos}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.baja ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {u.baja ? "Baja" : "Activo"}
                  </span>
                </div>
                {u.diagnostico && <p className="text-xs text-gray-500 mt-1">{u.diagnostico}</p>}
                <p className="text-xs text-blue-500 mt-2 group-hover:underline">Ver ficha →</p>
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
