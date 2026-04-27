# 🎬 Guía de Demostración

Guía paso a paso para probar todas las funcionalidades del sistema.

---

## 🚀 Inicio

### 1. Arrancar la Aplicación

```bash
docker compose up --build
```

Espera a ver: `✅ Base de datos lista con datos de ejemplo`

Abre: **http://localhost**

### 2. Credenciales

**Administrador:**
- Usuario: `admin`
- Contraseña: `nora2026`

**Terapeutas:**
- María: `maria` / `maria2026`
- Laura: `laura` / `laura2026`
- Carmen: `carmen` / `carmen2026`
- Ana: `ana` / `ana2026`

---

## 📋 Recorrido (15 minutos)

### 1. Dashboard y Usuarios (3 min)

**Dashboard**
- Accede con `admin` / `nora2026`
- Observa avisos pendientes
- Haz clic en un aviso para ir a la ficha

**Usuarios**
- Ve a "Usuarios"
- Prueba el buscador (escribe "Pablo")
- Abre "Filtros avanzados" y filtra por estado
- Haz clic en "Ver ficha" de Pablo Pérez
- Explora las pestañas: Resumen, Sesiones, Facturas, Avisos
- Añade un aviso nuevo

**Socios**
- Ve a "Socios"
- Observa el nº de socio automático
- Haz clic en "Ver ficha" de Carlos Pérez
- Observa usuarios vinculados

**Terapeutas**
- Ve a "Terapeutas"
- Observa métricas del mes en cada tarjeta
- Haz clic en "Ver sesiones" de María

---

### 2. Sesiones y Horarios (4 min)

**Grid de Sesiones**
- Observa el calendario mensual con colores
- Haz clic en una sesión "Programada"
- Cambia el estado a "Asistió"
- Añade actividad: "Ejercicios de fonación"
- Guarda y observa el cambio de color
- Prueba los filtros (usuario, servicio, estado)

**Horarios Habituales**
- Ve a "Horarios"
- Observa horarios agrupados por terapeuta
- Botón "Generar mes completo" crea todas las sesiones automáticamente

---

### 3. Facturación (4 min)

**Generar Facturas**
- Ve a "Facturación"
- Selecciona "Abril 2026"
- Haz clic en "⚡ Generar todas"
- Espera a que se generen ~24 facturas

**Explorar Facturas**
- Observa la paginación (15 por página)
- Prueba filtros avanzados (estado, importe, usuario)
- Haz clic en "Ver detalle" de una factura
- Descarga el PDF

**Descuentos**
- Busca factura de Pablo Pérez (>120€ → 10% descuento)
- Busca factura de Carmen Suárez (hermana de Pablo)
- Ambos tienen descuento si suma >120€

**Facturas Desactualizadas**
- Ve a "Sesiones" y cambia un estado
- Vuelve a "Facturación"
- Observa aviso naranja
- Haz clic en "Recalcular todas"

**Exportar**
- Haz clic en "Exportar Excel"
- Abre el archivo (hoja Resumen + hoja Detalle)

---

### 4. SEPA y Estadísticas (2 min)

**SEPA**
- Ve a "SEPA"
- Selecciona "Abril 2026"
- Haz clic en "Ver preview"
- Observa facturas incluidas (con IBAN) y excluidas (sin IBAN)
- Haz clic en "Descargar XML SEPA"
- El archivo está listo para enviar al banco

**Estadísticas**
- Ve a "Estadísticas"
- Observa gráficos interactivos
- Cambia rango de meses
- Pasa el ratón sobre los gráficos

---

### 5. Importación y Servicios (2 min)

**Importar**
- Ve a "Importar"
- Descarga plantilla de Socios
- Observa ejemplos e instrucciones
- Sube la plantilla
- Observa reporte de importación

**Servicios**
- Ve a "Servicios"
- Observa 13 servicios por categoría
- Edita un precio
- Guarda

---

### 6. Rol Terapeuta (2 min)

**Acceso Limitado**
- Cierra sesión
- Accede con `maria` / `maria2026`
- Observa menú limitado (solo Dashboard y Sesiones)

**Grid de Sesiones**
- Ve a "Sesiones"
- Solo ve sus propias sesiones
- Puede cambiar estados
- Puede ver fichas de usuarios (sin facturas ni avisos)

---

## 🎯 Casos de Uso

### Caso 1: Facturación Mensual
1. Terapeutas actualizan sesiones durante el mes
2. Fin de mes: "Facturación" → "Generar todas"
3. Si hay cambios: "Recalcular todas"
4. Marcar como "Cobrada"
5. "SEPA" → Generar remesa
6. Enviar XML al banco

### Caso 2: Hermanos con Descuento
1. Pablo y Carmen están vinculados al mismo socio (hermanos)
2. Suma de sus 2 facturas >120€
3. Ambos reciben 10% de descuento

### Caso 3: Sesión Programada vs Realizada
1. "Horarios" → "Generar mes completo" (Mayo)
2. Todas las sesiones en estado "Programada"
3. "Facturación" → Mayo → "Generar todas" = 0€ (programadas no cobrables)
4. "Sesiones" → Cambiar a "Asistió"
5. "Facturación" → "Recalcular todas" = importes correctos

---

## 📊 Datos Incluidos

- 1 admin + 4 terapeutas
- 16 socios (14 con IBAN, 2 sin IBAN)
- 24 usuarios con diagnósticos variados
- Usuarios hermanos para probar descuentos
- Usuario con 2 socios vinculados
- 13 servicios con precios reales
- ~1045 sesiones (marzo y abril 2026)
- 24 facturas de marzo (cobradas)
- 8 facturas de abril (5 pendientes, 2 cobradas, 1 anulada)
- 120 horarios habituales
- 6 avisos de ejemplo

---

## 🔄 Resetear Datos

```bash
docker compose down -v
docker compose up --build
```

---

<div align="center">

[⬆ Volver al README](./README.md)

</div>
