/**
 * Lógica de descuento del 10% para facturas NORA.
 */

const UMBRAL = 120;
const PCT    = 0.1;

function calcularDescuento(subtotal, subtotalHermano = null) {
  const aplicar =
    subtotal > UMBRAL ||
    (subtotalHermano !== null && subtotal + subtotalHermano > UMBRAL);
  const descuento = aplicar ? subtotal * PCT : 0;
  const total     = subtotal - descuento;
  return { aplicar, descuento, total };
}

// ─── Helpers reutilizables para generación de facturas ────────────────────────

/**
 * Agrupa sesiones por servicio y devuelve las líneas de factura.
 */
function agruparSesionesEnLineas(sesiones) {
  const agrupado = {};
  for (const s of sesiones) {
    if (!agrupado[s.servicioId]) agrupado[s.servicioId] = { servicio: s.servicio, count: 0 };
    agrupado[s.servicioId].count++;
  }
  return Object.values(agrupado).map(g => ({
    servicioId:   g.servicio.id,
    numSesiones:  g.count,
    precioSesion: g.servicio.precio,
    suma:         g.count * g.servicio.precio,
  }));
}

/**
 * Obtiene el subtotal del hermano (si existe) para calcular descuento conjunto.
 * También aplica descuento retroactivo a facturas de hermanos si corresponde.
 */
async function obtenerSubtotalHermano(prisma, usuarioId, subtotal, mes, anio) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { socioVinculadoId: true },
  });
  if (!usuario?.socioVinculadoId) return null;

  const hermanos = await prisma.usuario.findMany({
    where: { socioVinculadoId: usuario.socioVinculadoId, id: { not: usuarioId } },
    select: { id: true },
  });
  if (hermanos.length === 0) return null;

  const facturasHermanos = await prisma.factura.findMany({
    where: { usuarioId: { in: hermanos.map(h => h.id) }, mes, anio },
    select: { id: true, subtotal: true, descuento: true },
  });
  if (facturasHermanos.length === 0) return null;

  const subtotalHermano = facturasHermanos.reduce((acc, f) => acc + f.subtotal, 0);

  // Aplicar descuento retroactivo a hermanos si ahora supera el umbral
  const { aplicar } = calcularDescuento(subtotal, subtotalHermano);
  if (aplicar) {
    for (const fh of facturasHermanos) {
      if (fh.descuento === 0) {
        const { descuento: dh, total: th } = calcularDescuento(fh.subtotal);
        await prisma.factura.update({ where: { id: fh.id }, data: { descuento: dh, total: th } });
      }
    }
  }

  return subtotalHermano;
}

/**
 * Genera el siguiente numRecibo secuencial para el año dado.
 */
async function siguienteNumRecibo(prisma, anio) {
  const ultima = await prisma.factura.findFirst({
    where: { anio },
    orderBy: { numRecibo: "desc" },
    select: { numRecibo: true },
  });
  let seq = 1;
  if (ultima) {
    const match = ultima.numRecibo.match(/^(\d+)\//);
    if (match) seq = parseInt(match[1]) + 1;
  }
  return `${String(seq).padStart(2, "0")}/${anio}`;
}

module.exports = { calcularDescuento, agruparSesionesEnLineas, obtenerSubtotalHermano, siguienteNumRecibo, UMBRAL, PCT };
