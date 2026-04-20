# Generación de PDF de Facturas

## Formato

El PDF sigue el modelo oficial de NORA e incluye:

- **Logo** de la asociación
- **Datos del usuario**: nombre, dirección, CP, población, DNI
- **Nº de recibo** en formato `XX/YYYY` (secuencial por año) y fecha
- **Tabla de servicios** agrupados por categoría con nº sesiones, precio/sesión y suma
- **Subtotal**, descuento 10% (si aplica) y **total**
- **Pie de página**: "En Pola de Siero a [fecha]"

## Nombre del archivo

```
Factura_XX-YYYY_Apellidos.pdf
```

Ejemplo: `Factura_01-2026_García.pdf`

## Cómo generar

- Desde la tabla de **Facturación** → menú `•••` → "📄 Descargar PDF"
- Desde el **modal de detalle** de una factura → "📄 Descargar PDF"
- Desde la **ficha del usuario** → columna PDF en el historial de facturas

## Tecnología

Generación 100% client-side con **jsPDF** + **jspdf-autotable**. No requiere procesamiento en servidor.
