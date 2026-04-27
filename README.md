# 🏥 Sistema de Gestión — Asociación NORA

Sistema web de gestión para la **Asociación NORA**, entidad de apoyo a personas con parálisis cerebral y discapacidad múltiple en Pola de Siero, Asturias.

Desarrollado para el **Reto Solidario NTT Data 2026**, reemplazando el sistema actual de hojas de cálculo Excel por una aplicación web centralizada.

---

## 🛠 Tecnologías

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Base de datos** | SQLite + Prisma ORM |
| **Validación** | Zod |
| **Tests** | Jest (39 tests) |
| **Gráficos** | Recharts |
| **Contenedores** | Docker + nginx |

Todo open-source, sin costes de licencia.

---

## ⚡ Funcionalidades

### 👥 Gestión de Personas

**Usuarios (Personas con Discapacidad)**
- CRUD completo con datos personales, clínicos y bancarios
- Diagnóstico, % discapacidad, grado de dependencia
- Vinculación con 1 o 2 socios (padres/tutores)
- Sistema de bajas que conserva historial
- Ficha individual con sesiones, facturas y avisos

**Socios (Familiares/Colaboradores)**
- Gestión de cuotas y datos bancarios
- Nº de socio generado automáticamente
- Vinculación con múltiples usuarios

**Terapeutas**
- 4 especialidades: Logopedia, Psicología, Fisioterapia, T.O.
- Métricas mensuales en tiempo real
- Acceso directo a su grid de sesiones

### 📅 Horarios y Sesiones

**Horarios Habituales**
- Define qué días acude cada usuario a cada terapia
- Generación automática del mes completo con un clic
- Evita duplicados automáticamente

**Grid de Sesiones**
- Vista mensual por terapeuta
- 7 estados: Programada, Asistió, Falta, Festivo, Vacaciones, Permiso, Hospitalización
- Lógica de cobro automática (se cobra "Asistió" y "Falta")
- Actividad realizada y observaciones por sesión

### 💰 Facturación

- Generación automática desde sesiones del mes
- Generación masiva para todos los usuarios
- **Descuento del 10% automático:**
  - Individual: si factura >120€
  - Hermanos: si suma de 2 facturas de hermanos >120€ (ambos reciben descuento)
- Detección de facturas desactualizadas cuando cambian las sesiones
- Recálculo masivo con un clic
- Estados: Pendiente / Cobrada / Anulada
- Numeración secuencial por año (`01/2026`, `02/2026`...)
- Exportación a Excel con resumen y detalle

### 📄 PDFs de Facturas

- Generación client-side (sin servidor)
- Formato oficial NORA con logo
- Tabla de servicios agrupados por categoría
- Subtotal, descuento y total

### 💳 Remesas SEPA

- Generación de fichero XML **PAIN.008.001.02** (estándar europeo)
- Preview antes de generar
- Configurable: mes, año y fecha de cobro
- Compatible con todos los bancos europeos

### 📊 Estadísticas

- Facturación mensual (subtotal, descuento, total)
- Distribución de estados de facturas
- Sesiones mensuales y tasa de asistencia
- Actividad por terapeuta
- Top servicios más utilizados
- Filtros por año y rango de meses

### 📝 Avisos

- Notas internas por usuario
- Estados: Pendiente / Resuelto
- Visibles en Dashboard para acceso rápido

### 📥 Importación de Datos

- Importador Excel/CSV para socios y usuarios
- Plantillas descargables con ejemplos
- Validación completa (DNI, email, IBAN, etc.)
- Detección de duplicados

### 🎨 Interfaz

- Toasts de notificaciones
- Skeleton loaders durante carga
- Empty states cuando no hay datos
- Selectores filtrables por texto
- Columnas redimensionables en tablas
- Ordenamiento por columnas
- Filtros avanzados
- Paginación (15 items por página)

---

## 🚀 Instalación

### Con Docker (Recomendado)

```bash
git clone https://github.com/enolRodriguezHevia/nora-management-system.git
cd nora-management-system
docker compose up --build
```

**Accede en:** http://localhost

**Credenciales:**
- Admin: `admin` / `nora2026`
- Terapeutas: `maria` / `maria2026`, `laura` / `laura2026`, etc.

```bash
# Comandos útiles
docker compose down        # Parar
docker compose down -v     # Parar y borrar datos
docker compose logs -f     # Ver logs
```

### Sin Docker (Desarrollo)

**Requisitos:** Node.js 20+

```bash
# 1. Clonar repositorio
git clone https://github.com/enolRodriguezHevia/nora-management-system.git
cd nora-management-system

# 2. Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js      # Carga datos de ejemplo
npm run dev              # http://localhost:3001

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

**Accede en:** http://localhost:5173

**Credenciales:**
- Admin: `admin` / `nora2026`
- Terapeutas: `maria` / `maria2026`, `laura` / `laura2026`, etc.

---

## 📖 Guía de Uso

### Roles de Usuario

**Admin** — Acceso completo a todo el sistema

**Terapeutas** — Acceso solo a:
- Su grid de sesiones
- Fichas de sus usuarios (sin facturas ni avisos)

### Flujo de Trabajo Mensual

1. **Inicio de mes:** Generar sesiones desde Horarios Habituales
2. **Durante el mes:** Terapeutas actualizan estados de sesiones
3. **Fin de mes:** Generar facturas masivas
4. **Revisar:** Facturas desactualizadas (si hay cambios)
5. **Recalcular:** Si es necesario
6. **Marcar:** Facturas como "Cobrada"
7. **Generar:** Remesa SEPA
8. **Enviar:** XML al banco

### Datos de Ejemplo Incluidos

El sistema viene con:
- 1 admin + 4 terapeutas con credenciales
- 16 socios (14 con IBAN, 2 sin IBAN para probar exclusiones SEPA)
- 24 usuarios con diagnósticos variados
- Usuarios hermanos para probar descuentos
- Usuario con 2 socios vinculados (Elena Fernández)
- 13 servicios con precios reales
- ~1045 sesiones en marzo y abril 2026
- 24 facturas de marzo (cobradas)
- 8 facturas de abril (5 pendientes, 2 cobradas, 1 anulada)
- 120 horarios habituales configurados
- 6 avisos de ejemplo

**Listo para probar generación masiva de facturas, remesas SEPA y todo el flujo completo.**

---

## ✅ Tests

```bash
cd backend
npm test
```

**39 tests** cubriendo:
- Lógica de descuento del 10% (casos individuales, hermanos, casos límite)
- Generación de numRecibo secuencial
- Validaciones Zod (DNI, email, teléfono, CP, IBAN con módulo 97, enums)

---

## 🔒 Validaciones

Todas las rutas de escritura validan con **Zod** antes de tocar la base de datos:

| Campo | Validación |
|---|---|
| `dni` | Formato DNI/NIE/CIF español |
| `email` | Formato RFC válido |
| `telefono` | 7-15 dígitos |
| `cp` | Exactamente 5 dígitos |
| `iban` | Longitud por país + algoritmo módulo 97 |
| `tipologia` | Enum: Afectado / Colaborador |
| `grado` | Enum: Grado I / II / III |
| `especialidad` | Enum: 4 especialidades válidas |
| `estado` sesión | Enum: 7 estados válidos |
| `porcentajeDiscapacidad` | Entre 0 y 100 |

Los errores devuelven HTTP 422 con lista de campos y mensajes en español.

---

## ⚙️ Configuración SEPA

Para usar las remesas SEPA con datos reales, añade al `backend/.env`:

```env
NORA_IBAN=ES00000000000000000000      # IBAN real de la asociación
NORA_BIC=XXXXXXXX                     # BIC del banco
NORA_CREDITOR_ID=ESxxZZZxxxxxxxx      # Identificador de Acreedor SEPA
```

El Identificador de Acreedor SEPA se obtiene a través del banco de la asociación.

---

## 📚 Documentación Adicional

- **[DEMO.md](./DEMO.md)** — Guía paso a paso para probar el sistema
- **[docs/BASE_DE_DATOS.md](./docs/BASE_DE_DATOS.md)** — Diagrama y esquema de base de datos
- **[docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md)** — Documentación técnica

---

<div align="center">

**Desarrollado para el Reto Solidario NTT Data 2026**

[⬆ Volver arriba](#-sistema-de-gestión--asociación-nora)

</div>
