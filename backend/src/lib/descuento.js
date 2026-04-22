/**
 * Lógica de descuento del 10% para facturas NORA.
 *
 * Reglas:
 * - Se aplica si el subtotal individual supera 120€
 * - Se aplica si la suma del subtotal con el de un hermano/a supera 120€
 *   (hermano = usuario con el mismo socioVinculadoId)
 */

const UMBRAL = 120;
const PCT    = 0.1;

/**
 * Calcula si se debe aplicar descuento dado el subtotal propio
 * y opcionalmente el subtotal de un hermano.
 *
 * @param {number} subtotal - Subtotal de la factura actual
 * @param {number|null} subtotalHermano - Subtotal del hermano (null si no hay)
 * @returns {{ aplicar: boolean, descuento: number, total: number }}
 */
function calcularDescuento(subtotal, subtotalHermano = null) {
  const aplicar =
    subtotal > UMBRAL ||
    (subtotalHermano !== null && subtotal + subtotalHermano > UMBRAL);

  const descuento = aplicar ? subtotal * PCT : 0;
  const total     = subtotal - descuento;

  return { aplicar, descuento, total };
}

module.exports = { calcularDescuento, UMBRAL, PCT };
