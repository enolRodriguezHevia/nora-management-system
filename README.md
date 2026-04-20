# Sistema de Gestión — Asociación NORA

Sistema de gestión interna para la **Asociación NORA**, entidad de apoyo a personas con parálisis cerebral y discapacidad múltiple con sede en Pola de Siero, Asturias.

Desarrollado como propuesta para el **Reto Solidario NTT Data**, sustituyendo el sistema actual basado en hojas de cálculo Excel por una aplicación web moderna, centralizada y accesible.

---

## Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS + Heroicons |
| Backend | Node.js + Express |
| Base de datos | SQLite + Prisma ORM |
| Validación | Zod |
| Gráficos | Recharts |
| Contenedores | Docker + nginx |

Todo open-source, sin costes de licencia.

---

## Funcionalidades

### Gestión de personas
- **Usuarios** — CRUD completo con datos personales, clínicos (diagnóstico, % discapacidad, grado), socio vinculado y datos bancarios. Dar de baja / reactivar conservando historial.
- **Socios** — CRUD con datos bancarios, IBAN, cadencia y cuota de cobro.
- **Terapeutas** — Gestión por especialidad con métricas del mes (sesiones, asistencia, cobrables, programadas) y acceso directo al grid de sesiones.
- **Fichas individuales** — Vista detallada de cada usuario y socio: datos personales, sesiones del mes, historial de facturas, vínculos y KPIs. Botón de edición directo desde la ficha.

### Sesiones y asistencia
- Grid mensual interactivo por terapeuta
- 7 estados: **Programada**, Asistió, Falta, Festivo, Vacaciones terapeuta, Permiso, Hospitalización
- Estado "Programada" para planificar sesiones futuras — no cobrable
- Lógica de cobro automática: se cobra "asistió" y "falta", no se cobra el resto
- Navegación directa desde Terapeutas al grid de cada terapeuta

### Facturación
- Generación automática de facturas desde sesiones del mes
- Generación masiva para todos los usuarios con un clic
- Descuento del 10% automático: individual >120€ o suma con hermanos >120€
- Estados: pendiente, cobrada, anulada
- Numeración secuencial por año (formato `XX/YYYY`)
- Aviso cuando hay sesiones en estado "Programada" sin actualizar
- Badge de advertencia por usuario con sesiones programadas pendientes
- Exportación a Excel con hoja de resumen y hoja de detalle por servicio

### PDFs de facturas
- Generación client-side con jsPDF
- Formato oficial NORA: logo, datos del usuario, tabla de servicios agrupados por categoría, subtotal, descuento y total
- Pie de página con lugar y fecha: "En Pola de Siero a..."

### Importación de datos
- Importador Excel/CSV para socios y usuarios
- Plantillas descargables con datos de ejemplo e instrucciones
- Validación completa con Zod: DNI, email, teléfono, CP, IBAN (módulo 97), enums
- Detección de duplicados: actualiza si existe, crea si no
- Reporte de errores por fila sin detener la importación

### Remesas SEPA
- Generación de fichero XML **PAIN.008.001.02** (estándar europeo de adeudo directo)
- Preview antes de generar: tabla de adeudos incluidos y excluidos por falta de IBAN
- Configurable: mes, año y fecha de cobro
- Compatible con todos los bancos europeos

### Estadísticas
- Facturación mensual (subtotal, descuento, total)
- Distribución de estados de facturas
- Sesiones mensuales (total, cobrables, asistencia)
- Distribución de estados de sesiones
- Actividad por terapeuta y top servicios
- Filtros por año y rango de meses

### Autenticación
- Login con usuario y contraseña (JWT, 8h de sesión)
- Todas las rutas de la API protegidas con middleware JWT
- Credenciales por defecto: `admin` / `nora2026`
- Botón de cierre de sesión en el sidebar con nombre del usuario

### Avisos por usuario
- Notas internas por usuario visibles en su ficha
- Estados: pendiente (ámbar) / resuelto (tachado)
- Avisos pendientes visibles en el Dashboard para acceso rápido
- 13 servicios con precios del PDF de requisitos
- 2 centros de hipoterapia reales: Equitación Positiva y Asoc. Asturiana de Terapias Ecuestres
- Precios editables desde la interfaz

---

## UX y calidad

- **Toasts** — notificaciones de éxito/error/aviso con auto-cierre (errores 10s, resto 3.5s)
- **Skeleton loaders** — placeholders animados en tablas, fichas y gráficos durante la carga
- **Empty states** — mensajes descriptivos cuando no hay datos o no hay resultados de filtro
- **Menú de acciones** — menú `•••` con portal para evitar recortes en tablas
- **Animaciones** — modales con fade + slide suave
- **Mensajes de error legibles** — campos con nombres en español, formato con bullets
- **Columnas redimensionables** — drag en cabeceras de tabla
- **Ordenamiento de tablas** — clic en cabecera ordena asc/desc, flecha indica columna activa
- **Filtros avanzados** — por estado, tipología, socio, importe, etc.
- **Nº Socio automático** — generado por el sistema, no editable manualmente

---

## Validaciones backend

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

Los errores devuelven HTTP 422 con lista de campos y mensajes en español. Los campos opcionales vacíos no generan error de formato.

---

## Instalación y arranque

### Con Docker (recomendado)

```bash
docker compose up --build
```

La aplicación estará disponible en **http://localhost**

La primera vez tarda unos minutos en construir las imágenes. Las siguientes veces arranca en segundos con `docker compose up`.

```bash
docker compose down        # Parar
docker compose down -v     # Parar y borrar datos
```

### Sin Docker (desarrollo local)

**Requisitos:** Node.js 20+

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js      # Carga datos de ejemplo
node src/index.js        # http://localhost:3001

# Frontend (otra terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

---

## Datos de ejemplo incluidos

El seed carga automáticamente:
- 4 terapeutas (Logopedia, Psicología, Fisioterapia, Terapia Ocupacional)
- 13 servicios con precios reales del PDF de requisitos
- 6 socios con datos bancarios
- 9 usuarios con diagnósticos y socios vinculados
- ~286 sesiones en marzo y abril 2026
- Facturas generadas para ambos meses

---

## Configuración SEPA

Para usar las remesas SEPA con datos reales, añade al `backend/.env`:

```env
NORA_IBAN=ES00000000000000000000      # IBAN real de la asociación
NORA_BIC=XXXXXXXX                     # BIC del banco de la asociación
NORA_CREDITOR_ID=ESxxZZZxxxxxxxx      # Identificador de Acreedor SEPA
```

El Identificador de Acreedor SEPA se obtiene a través del banco de la asociación.
