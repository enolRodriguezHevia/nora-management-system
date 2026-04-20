import { useEffect, useState } from "react";
import { serviciosService } from "../services/api";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../utils/errorHandler";

const CATEGORIA_COLOR = {
  "Tratamiento Individual": "bg-blue-100 text-blue-700",
  "Aula Terapéutica":       "bg-purple-100 text-purple-700",
  "Atención Integral":      "bg-green-100 text-green-700",
  "Taller":                 "bg-orange-100 text-orange-700",
  "Escuela de Padres":      "bg-pink-100 text-pink-700",
  "Hipoterapia":            "bg-yellow-100 text-yellow-700",
};

export default function Servicios() {
  const toast = useToast();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [saving, setSaving]       = useState(false);

  const fetchServicios = () => {
    setLoading(true);
    serviciosService.getAll()
      .then(r => setServicios(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServicios(); }, []);

  // Solo hipoterapia tiene precio variable según el PDF
  const esEditable = (s) => s.categoria === "Hipoterapia";

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditPrecio(String(s.precio));
  };

  const cancelEdit = () => { setEditingId(null); setEditPrecio(""); };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await serviciosService.update(id, { precio: Number(editPrecio) });
      setEditingId(null);
      fetchServicios();
      toast.success("Precio actualizado correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Agrupar por categoría
  const porCategoria = servicios.reduce((acc, s) => {
    if (!acc[s.categoria]) acc[s.categoria] = [];
    acc[s.categoria].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Servicios y tarifas</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona los precios de cada servicio. Haz clic en el precio para editarlo.</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(porCategoria).map(([categoria, items]) => (
            <div key={categoria} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIA_COLOR[categoria] || "bg-gray-100 text-gray-600"}`}>
                  {categoria}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                    <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Precio / sesión</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{s.nombre}</td>
                      <td className="px-5 py-3 text-right">
                        {editingId === s.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={editPrecio}
                              onChange={e => setEditPrecio(e.target.value)}
                              className="w-24 border border-blue-400 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <span className="text-gray-500 text-sm">€</span>
                          </div>
                        ) : (
                          <span className={`font-semibold ${s.precio === 0 ? "text-red-500" : "text-gray-800"}`}>
                            {s.precio === 0 ? "Sin precio" : `${s.precio.toFixed(2)} €`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {esEditable(s) && (
                          editingId === s.id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => saveEdit(s.id)}
                                disabled={saving}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                              >
                                {saving ? "..." : "Guardar"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(s)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Editar precio
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Nota sobre hipoterapia */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <strong>Hipoterapia:</strong> precio variable según el centro. Actualiza el precio de cada centro antes de generar las facturas del mes.
      </div>
    </div>
  );
}
