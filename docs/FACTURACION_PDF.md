# Generación de PDF de Facturas

## Funcionalidad

El sistema permite generar facturas en formato PDF descargable con el diseño oficial de NORA.

## Características

### Formato del PDF
- **Logo y cabecera** de la asociación NORA
- **Datos del usuario**: nombre, dirección, código postal, población, DNI
- **Número de recibo** y fecha de emisión
- **Tabla de servicios** agrupados por categoría:
  - Tratamientos individuales (Logopedia, Psicología, Fisioterapia, T.O.)
  - Aulas terapéuticas (Aula TIC, Psicomotricidad)
  - Atención Integral Adultos
  - Talleres (Cocina, Peluquería, Gimnasia)
  - Escuela de padres
  - Hipoterapia
- **Detalle por servicio**: número de sesiones, precio por sesión, suma
- **Subtotal, descuento (10% si aplica) y total**
- **Pie de página** con lugar y fecha de emisión

### Cómo usar

1. **Desde la tabla de facturas**: 
   - Haz clic en el botón "📄 PDF" en la columna de acciones
   - El PDF se descargará automáticamente

2. **Desde el modal de detalle**:
   - Haz clic en "Ver" para abrir el detalle de la factura
   - Haz clic en "📄 Descargar PDF" en la cabecera del modal
   - El PDF se descargará automáticamente

### Nombre del archivo

El archivo se descarga con el formato:
```
Factura_XX-YYYY_Apellidos.pdf
```

Donde XX es el número secuencial de la factura en ese año.

Ejemplo: `Factura_01-2026_García.pdf`, `Factura_02-2026_López.pdf`

## Tecnología

- **jsPDF**: Librería para generación de PDFs en el navegador
- **jspdf-autotable**: Plugin para crear tablas con formato profesional
- **100% client-side**: No requiere procesamiento en el servidor

## Ventajas sobre Excel

- ✅ Formato profesional y consistente
- ✅ No editable (integridad de datos)
- ✅ Listo para imprimir o enviar por email
- ✅ Generación instantánea sin dependencias externas
- ✅ Compatible con todos los navegadores modernos
