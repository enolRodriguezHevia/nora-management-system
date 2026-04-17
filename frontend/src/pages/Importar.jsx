import { useState, useRef } from "react";
import { API_URL } from "../services/api";

const TIPOS = [
  {
    key: "socios",
    label: "Socios",
    icon: "👥",
    descripcion: "Importa socios con sus datos personales, bancarios y de contacto.",
    campos: ["numSocio (obligatorio)", "nombre (obligatorio)", "apellidos (obligatorio)", "dni", "direccion", "poblacion", "cp", "provincia", "telefono", "email", "tipologia", "iban", "cadencia", "cuota", "..."],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: "🧑‍🦽",
    descripcion: "Importa usuarios con sus datos personales, diagnóstico y socio vinculado.",
    campos: ["nombre (obligatorio)", "apellidos (obligatorio)", "dni", "fechaNacimiento", "diagnostico", "porcentajeDiscapacidad", "grado", "numSocio", "..."],
  },
];

export default function Importar() {
  const [tipo, setTipo] = useState("socios");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const tipoActual = TIPOS.find(t => t.key === tipo);

  function onFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Formato no válido. Usa .xlsx, .xls o .csv");
      setArchivo(null);
      return;
    }
    setArchivo(f);
    setError(null);
    setResultado(null);
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      inputRef.current.files = e.dataTransfer.files;
      onFileChange({ target: { files: [f] } });
    }
  }

  async function handleImportar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("file", archivo);

      const res = await fetch(`${API_URL}/importar/${tipo}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setResultado(data);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function descargarPlantilla() {
    window.open(`${API_URL}/importar/plantilla/${tipo}`, "_blank");
  }

  const totalOk = resultado ? resultado.creados + resultado.actualizados : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Importar datos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Importa socios y usuarios desde un archivo Excel o CSV. Los registros existentes se actualizarán; los nuevos se crearán.
        </p>
      </div>

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 gap-4">
        {TIPOS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTipo(t.key); setArchivo(null); setResultado(null); setError(null); if (inputRef.current) inputRef.current.value = ""; }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              tipo === t.key
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="font-semibold text-gray-800">{t.label}</div>
            <div className="text-xs text-gray-500 mt-1">{t.descripcion}</div>
          </button>
        ))}
      </div>

      {/* Plantilla y campos */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-700">Plantilla Excel — {tipoActual.label}</span>
          <button
            onClick={descargarPlantilla}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Descargar plantilla
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Descarga la plantilla, rellénala con tus datos y súbela aquí. Incluye una hoja de instrucciones con todos los campos.
        </p>
        <div className="flex flex-wrap gap-1">
          {tipoActual.campos.map(c => (
            <span key={c} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">{c}</span>
          ))}
        </div>
      </div>

      {/* Zona de subida */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          archivo ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFileChange}
        />
        {archivo ? (
          <div className="space-y-1">
            <div className="text-3xl">📄</div>
            <div className="font-medium text-blue-700">{archivo.name}</div>
            <div className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(1)} KB — listo para importar</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-3xl text-gray-300">📂</div>
            <div className="text-gray-500 font-medium">Arrastra tu archivo aquí o haz clic para seleccionar</div>
            <div className="text-xs text-gray-400">Formatos aceptados: .xlsx, .xls, .csv</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Botón importar */}
      <button
        onClick={handleImportar}
        disabled={!archivo || cargando}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {cargando ? (
          <><span className="animate-spin">⏳</span> Importando...</>
        ) : (
          <>⬆️ Importar {tipoActual.label}</>
        )}
      </button>

      {/* Resultado */}
      {resultado && (
        <div className="rounded-xl border overflow-hidden">
          <div className={`px-5 py-3 font-semibold text-white ${totalOk > 0 ? "bg-green-600" : "bg-yellow-500"}`}>
            {totalOk > 0 ? "✅ Importación completada" : "⚠️ Importación con advertencias"}
          </div>
          <div className="p-5 bg-white space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{resultado.creados}</div>
                <div className="text-xs text-gray-500 mt-1">Registros creados</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{resultado.actualizados}</div>
                <div className="text-xs text-gray-500 mt-1">Registros actualizados</div>
              </div>
              <div className={`rounded-lg p-3 ${resultado.errores.length > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                <div className={`text-2xl font-bold ${resultado.errores.length > 0 ? "text-red-700" : "text-gray-400"}`}>
                  {resultado.errores.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Errores</div>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div>
                <div className="text-sm font-medium text-red-700 mb-2">Filas con errores:</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {resultado.errores.map((e, i) => (
                    <div key={i} className="text-xs bg-red-50 border border-red-100 rounded px-3 py-1.5 text-red-700">
                      <span className="font-medium">Fila {e.fila}:</span> {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
