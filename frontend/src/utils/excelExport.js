import * as XLSX from "xlsx";

const MESES_LABEL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/**
 * Exporta un listado de facturas a Excel con dos hojas:
 *  - "Resumen": una fila por factura
 *  - "Detalle": una fila por línea de servicio
 */
export function exportarFacturasExcel(facturas, mes, anio) {
  const mesLabel = MESES_LABEL[mes - 1];
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen ──────────────────────────────────────────────────────
  const resumenData = facturas.map(f => ({
    "Nº Recibo":   f.numRecibo,
    "Usuario":     `${f.usuario?.nombre} ${f.usuario?.apellidos}`,
    "Mes":         `${mesLabel} ${anio}`,
    "Fecha":       new Date(f.fecha).toLocaleDateString("es-ES"),
    "Subtotal (€)": f.subtotal,
    "Descuento (€)": f.descuento > 0 ? -f.descuento : 0,
    "Total (€)":   f.total,
    "Estado":      f.estado.charAt(0).toUpperCase() + f.estado.slice(1),
  }));

  // Fila de totales al final
  const totalSubtotal  = facturas.reduce((s, f) => s + f.subtotal, 0);
  const totalDescuento = facturas.reduce((s, f) => s + f.descuento, 0);
  const totalTotal     = facturas.reduce((s, f) => s + f.total, 0);
  resumenData.push({
    "Nº Recibo":    "TOTAL",
    "Usuario":      "",
    "Mes":          "",
    "Fecha":        "",
    "Subtotal (€)": totalSubtotal,
    "Descuento (€)": -totalDescuento,
    "Total (€)":    totalTotal,
    "Estado":       "",
  });

  const wsResumen = XLSX.utils.json_to_sheet(resumenData);

  // Anchos de columna
  wsResumen["!cols"] = [
    { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 12 },
    { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // ── Hoja 2: Detalle por servicio ─────────────────────────────────────────
  const detalleData = [];
  for (const f of facturas) {
    for (const l of (f.lineas || [])) {
      detalleData.push({
        "Nº Recibo":      f.numRecibo,
        "Usuario":        `${f.usuario?.nombre} ${f.usuario?.apellidos}`,
        "Servicio":       l.servicio?.nombre || "",
        "Nº Sesiones":    l.numSesiones,
        "Precio/Sesión (€)": l.precioSesion,
        "Suma (€)":       l.suma,
        "Estado factura": f.estado,
      });
    }
  }

  if (detalleData.length > 0) {
    const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
    wsDetalle["!cols"] = [
      { wch: 16 }, { wch: 28 }, { wch: 30 },
      { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle servicios");
  }

  // ── Descargar ────────────────────────────────────────────────────────────
  const filename = `Facturas_${mesLabel}_${anio}.xlsx`;
  XLSX.writeFile(wb, filename);
}
