import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Genera un PDF de factura con el formato del modelo NORA
 * @param {Object} factura - Objeto factura con usuario, lineas, etc.
 */
export function generarPDFFactura(factura) {
  try {
    console.log("Generando PDF para factura:", factura);
    
    if (!factura || !factura.lineas || factura.lineas.length === 0) {
      console.error("Factura inválida o sin líneas:", factura);
      alert("Error: La factura no tiene líneas de detalle");
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // ─── LOGO Y CABECERA ───────────────────────────────────────────────────────
    // Cargar y agregar el logo
    const logoImg = new Image();
    logoImg.src = "/90f6b-nora.jpg";
    
    logoImg.onload = () => {
      // Agregar logo (ajustar tamaño según necesites)
      doc.addImage(logoImg, "JPEG", 20, 10, 40, 20);
      
      // Texto de la asociación al lado del logo
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      // Línea horizontal superior
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Continuar con el resto del PDF
      generarRestoPDF(doc, factura, pageWidth);
    };
    
    logoImg.onerror = () => {
      console.warn("No se pudo cargar el logo, generando PDF sin imagen");
      // Si falla la carga del logo, generar sin él
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("NORA", 20, 20);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Asociación de apoyo a personas", 20, 26);
      doc.text("con parálisis cerebral y/o discapacidad múltiple", 20, 30);
      
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      generarRestoPDF(doc, factura, pageWidth);
    };
    
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}

/**
 * Genera el resto del contenido del PDF (después del logo)
 */
function generarRestoPDF(doc, factura, pageWidth) {
  try {
    // ─── DATOS DEL USUARIO ─────────────────────────────────────────────────────
    const usuario = factura.usuario || {};
    const yStart = 45;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Tabla de datos del usuario
    const datosUsuario = [
      ["USUARIO", usuario.nombre + " " + usuario.apellidos],
      ["DIRECCIÓN", usuario.direccion || ""],
      ["CÓDIGO POSTAL", usuario.cp || ""],
      ["POBLACIÓN", usuario.poblacion || ""],
      ["C.I.F. o D.N.I.", usuario.dni || ""],
    ];
    
    autoTable(doc, {
      startY: yStart,
      head: [],
      body: datosUsuario,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40, fillColor: [240, 240, 240] },
        1: { cellWidth: 130 },
      },
      margin: { left: 20, right: 20 },
    });
    
    // ─── NÚMERO DE RECIBO Y FECHA ──────────────────────────────────────────────
    const yRecibo = doc.lastAutoTable.finalY + 10;
    
    autoTable(doc, {
      startY: yRecibo,
      head: [],
      body: [
        ["Nº RECIBO", factura.numRecibo],
        ["FECHA", new Date(factura.fecha).toLocaleDateString("es-ES")],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40, fillColor: [240, 240, 240] },
        1: { cellWidth: 50 },
      },
      margin: { left: 20 },
    });
    
    // ─── TABLA DE SERVICIOS ────────────────────────────────────────────────────
    const yServicios = doc.lastAutoTable.finalY + 10;
    
    // Construir filas de la tabla agrupadas por categoría
    const filasServicios = [];
    
    // Agrupar líneas por categoría
    const lineasPorCategoria = {};
    factura.lineas.forEach(linea => {
      const categoria = linea.servicio?.categoria || "Otros";
      if (!lineasPorCategoria[categoria]) {
        lineasPorCategoria[categoria] = [];
      }
      lineasPorCategoria[categoria].push(linea);
    });
    
    // Mapeo de categorías a etiquetas de la tabla
    const etiquetasCategoria = {
      "Tratamiento Individual": "Tratamientos\nindividuales",
      "Aula Terapéutica": "Aulas\nterapéuticas",
      "Atención Integral": "Atención Integral Adultos",
      "Taller": "Talleres",
      "Escuela de Padres": "Escuela de padres",
      "Hipoterapia": "Hipoterapia",
    };
    
    // Orden de categorías según el modelo
    const ordenCategorias = [
      "Tratamiento Individual",
      "Aula Terapéutica",
      "Atención Integral",
      "Taller",
      "Escuela de Padres",
      "Hipoterapia",
    ];
    
    ordenCategorias.forEach(categoria => {
      const lineas = lineasPorCategoria[categoria];
      if (!lineas || lineas.length === 0) return;
      
      const etiqueta = etiquetasCategoria[categoria] || categoria;
      
      if (lineas.length === 1) {
        // Una sola línea: mostrar categoría y servicio en la misma fila
        filasServicios.push([
          etiqueta,
          lineas[0].servicio?.nombre || "",
          lineas[0].numSesiones || "",
          (lineas[0].precioSesion || 0).toFixed(2) + " €",
          (lineas[0].suma || 0).toFixed(2) + " €",
        ]);
      } else {
        // Múltiples líneas: usar rowSpan para la categoría
        filasServicios.push([
          { content: etiqueta, rowSpan: lineas.length, styles: { fontStyle: "bold", valign: "middle" } },
          lineas[0].servicio?.nombre || "",
          lineas[0].numSesiones || "",
          (lineas[0].precioSesion || 0).toFixed(2) + " €",
          (lineas[0].suma || 0).toFixed(2) + " €",
        ]);
        
        for (let i = 1; i < lineas.length; i++) {
          filasServicios.push([
            lineas[i].servicio?.nombre || "",
            lineas[i].numSesiones || "",
            (lineas[i].precioSesion || 0).toFixed(2) + " €",
            (lineas[i].suma || 0).toFixed(2) + " €",
          ]);
        }
      }
    });
    
    // Filas de totales
    filasServicios.push([
      { content: "SUMA", colSpan: 4, styles: { fontStyle: "bold", halign: "right" } },
      (factura.subtotal || 0).toFixed(2) + " €",
    ]);
    
    if (factura.descuento > 0) {
      filasServicios.push([
        { content: "10% descuento", colSpan: 4, styles: { fontStyle: "bold", halign: "right" } },
        "-" + (factura.descuento || 0).toFixed(2) + " €",
      ]);
    }
    
    filasServicios.push([
      { content: "SUMA TOTAL", colSpan: 4, styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220] } },
      { content: (factura.total || 0).toFixed(2) + " €", styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
    ]);
    
    autoTable(doc, {
      startY: yServicios,
      head: [["", "TRATAMIENTO/mes", "Nº SESIONES", "PRECIO/SESIÓN", "SUMA"]],
      body: filasServicios,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });
    
    // ─── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    const yFinal = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const fechaFactura = new Date(factura.fecha);
    const textoFecha = `En Pola de Siero a ${fechaFactura.getDate()} de ${meses[fechaFactura.getMonth()]} de ${fechaFactura.getFullYear()}`;
    
    doc.text(textoFecha, pageWidth / 2, yFinal, { align: "center" });
    
    // ─── DESCARGAR PDF ─────────────────────────────────────────────────────────
    // Formato: Factura_XX-YYYY_Apellidos.pdf (ej: Factura_01-2026_García.pdf)
    const nombreArchivo = `Factura_${factura.numRecibo.replace(/\//g, "-")}_${usuario.apellidos || "Usuario"}.pdf`;
    console.log("Descargando PDF:", nombreArchivo);
    doc.save(nombreArchivo);
    console.log("PDF generado exitosamente");
  } catch (error) {
    console.error("Error al generar resto del PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}
