# Guía de uso — Sistema de Gestión NORA

## Acceso al sistema

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `nora2026` | Administrador (acceso completo) |
| `maria` | `maria2026` | Terapeuta — Logopeda |
| `laura` | `laura2026` | Terapeuta — Psicóloga |
| `carmen` | `carmen2026` | Terapeuta — Terapeuta Ocupacional |
| `ana` | `ana2026` | Terapeuta — Fisioterapeuta |

---

## Flujo de trabajo mensual

### Antes (con Excel)
1. Aroa crea una plantilla Excel para cada terapeuta cada mes
2. Cada terapeuta rellena su plantilla día a día
3. Aroa recoge las 4 plantillas al final del mes
4. Aroa calcula manualmente los recibos de cada usuario
5. Aroa pasa los recibos al banco uno a uno

### Ahora (con el sistema)

**A principios de mes:**
1. Ir a **Horarios** → "Generar mes" o "Generar rango de meses"
2. El sistema crea automáticamente todas las sesiones en estado "Programada"

**Durante el mes (las terapeutas):**
3. Cada terapeuta entra con su usuario y ve su grid de sesiones
4. Va marcando las excepciones: faltas, festivos, permisos, hospitalizaciones...
5. Puede consultar la ficha de cada usuario para ver su diagnóstico e historial

**A final de mes (Aroa):**
6. Ir a **Facturación** → "Generar todas" para crear todas las facturas del mes
7. El sistema aplica automáticamente el descuento del 10% cuando corresponde
8. Ir a **Remesas SEPA** → seleccionar mes → "Ver preview" → "Descargar XML SEPA"
9. Subir el fichero XML al banco para cobrar por domiciliación

---

## Funcionalidades principales

### 👥 Gestión de personas

**Usuarios** (`/usuarios`)
- Lista de personas con discapacidad que reciben servicios
- Crear, editar, dar de baja y reactivar
- Ficha completa con pestañas: Resumen, Sesiones, Facturas, Avisos
- Vinculación con socios (quién paga)

**Socios** (`/socios`)
- Familiares o colaboradores que pagan las cuotas
- Datos bancarios e IBAN para domiciliación
- Ficha con usuarios vinculados

**Terapeutas** (`/terapeutas`)
- Métricas del mes: sesiones dadas, % asistencia, cobrables, programadas
- Acceso directo al grid de sesiones de cada terapeuta

### 📅 Sesiones

**Grid mensual** (`/sesiones`)
- Vista por terapeuta y mes
- 7 estados: Programada, Asistió, Falta, Festivo, Vacaciones terapeuta, Permiso, Hospitalización
- Clic en celda → panel lateral para registrar estado, actividad y observaciones
- Las terapeutas solo ven sus propias sesiones

**Horarios habituales** (`/horarios`)
- Define qué días acude cada usuario a cada terapia
- "Generar mes" → crea todas las sesiones del mes en estado Programada
- "Generar rango de meses" → genera el curso completo de una vez

### 🧾 Facturación

**Facturas** (`/facturacion`)
- Generar factura individual o masiva para todos los usuarios
- Descuento del 10% automático: si el recibo supera 120€ o la suma con hermanos supera 120€
- Numeración secuencial por año: `01/2026`, `02/2026`...
- Aviso cuando hay facturas desactualizadas → "Recalcular todas"
- Exportar a Excel con resumen y detalle por servicio

**PDFs de facturas**
- Formato oficial NORA con logo, datos del usuario y tabla de servicios
- Descargable desde la tabla o desde la ficha del usuario

### 🏦 Remesas SEPA (`/sepa`)
- Genera fichero XML PAIN.008.001.02 (estándar bancario europeo)
- Preview antes de generar: qué socios se incluyen y cuáles no tienen IBAN
- Listo para subir al banco y cobrar por domiciliación

### 📊 Estadísticas (`/estadisticas`)
- Facturación mensual, estado de facturas, sesiones por mes
- Actividad por terapeuta, top servicios
- Filtros por año y rango de meses

### 📥 Importar datos (`/importar`)
- Importa socios y usuarios desde Excel o CSV
- Plantillas descargables con instrucciones
- Validación completa: DNI, email, teléfono, CP, IBAN con módulo 97
- Detecta duplicados: actualiza si existe, crea si no

---

## Datos de prueba incluidos

Al arrancar el sistema se cargan automáticamente:

- **9 usuarios** con diagnósticos reales (parálisis cerebral, síndrome de Down, TEA, etc.)
- **6 socios** con datos bancarios e IBAN
- **4 terapeutas** con sus usuarios asignados
- **~300 sesiones** en marzo y abril 2026 con estados variados
- **Facturas de marzo** ya generadas y cobradas (para ver estadísticas)
- **Horarios habituales** configurados para generar meses futuros
- **Avisos** de ejemplo en fichas de usuarios

---

## Configuración para producción

Para usar con datos reales de la asociación, editar `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET="cambiar-por-clave-segura"

# Para remesas SEPA reales:
NORA_IBAN=ES00000000000000000000
NORA_BIC=XXXXXXXX
NORA_CREDITOR_ID=ESxxZZZxxxxxxxx
```

El Identificador de Acreedor SEPA (`NORA_CREDITOR_ID`) se obtiene a través del banco de la asociación.
