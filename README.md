# Sistema de Gestión — Asociación NORA

Sistema de gestión interna para la **Asociación NORA**, entidad de apoyo a personas con parálisis cerebral y discapacidad múltiple con sede en Pola de Siero, Asturias.

Desarrollado como propuesta para el **Reto Solidario NTT Data**, sustituyendo el sistema actual basado en hojas de cálculo Excel por una aplicación web moderna, centralizada y accesible.

---

## Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | SQLite + Prisma ORM |
| Validación | Zod |
| Gráficos | Recharts |
| Iconos | Heroicons |

Todo open-source, sin costes de licencia.

---

## Funcionalidades

### Gestión de personas
- **Usuarios** — personas con discapacidad que reciben servicios. CRUD completo con datos personales, clínicos (diagnóstico, % discapacidad, grado), socio vinculado y datos bancarios.
- **Socios** — familiares o colaboradores que pagan las cuotas. CRUD con datos bancarios, IBAN y cadencia de cobro.
- **Terapeutas** — profesionales que imparten sesiones. Gestión por especialidad.
- **Fichas individuales** — vista detallada de cada usuario y socio con toda su información, sesiones del mes, historial de facturas y vínculos entre personas.

### Sesiones y asistencia
- Grid mensual interactivo por terapeuta
- 6 estados: Asistió, Falta, Festivo, Vacaciones terapeuta, Permiso, Hospitalización
- Lógica de cobro automática: se cobra "asistió" y "falta", no se cobra el resto

### Facturación
- Generación automática de facturas desde sesiones del mes
- Generación masiva para todos los usuarios con un clic
- Descuento del 10% automático: individual >120€ o suma con hermanos >120€
- Estados: pendiente, cobrada, anulada
- Numeración secuencial por año (formato `XX/YYYY`)
- Exportación a Excel con hoja de resumen y hoja de detalle por servicio

### PDFs de facturas
- Generación client-side con jsPDF
- Formato oficial NORA: logo, datos del usuario, tabla de servicios agrupados por categoría, subtotal, descuento y total
- Pie de página con lugar y fecha

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
- Actividad por terapeuta
- Top servicios
- Filtros por año y rango de meses

### Catálogo de servicios
- 13 servicios con precios del PDF de requisitos
- 2 centros de hipoterapia reales: Equitación Positiva y Asoc. Asturiana de Terapias Ecuestres
- Precios editables desde la interfaz

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
| `estado` sesión | Enum: 6 estados válidos |
| `porcentajeDiscapacidad` | Entre 0 y 100 |

Los errores devuelven HTTP 422 con lista de campos y mensajes en español.

---

## Estructura del proyecto

```
nora-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos de datos
│   │   ├── seed.js             # Datos de ejemplo
│   │   └── dev.db              # Base de datos SQLite
│   └── src/
│       ├── index.js            # Servidor Express
│       ├── lib/
│       │   ├── prisma.js       # Cliente Prisma
│       │   └── schemas.js      # Schemas Zod compartidos
│       └── routes/
│           ├── socios.js
│           ├── usuarios.js
│           ├── terapeutas.js
│           ├── servicios.js
│           ├── sesiones.js
│           ├── facturas.js
│           ├── estadisticas.js
│           ├── importar.js
│           └── sepa.js
└── frontend/
    └── src/
        ├── components/
        │   ├── AdvancedFilters.jsx
        │   ├── ConfirmModal.jsx
        │   ├── FormField.jsx
        │   └── RowMenu.jsx
        ├── hooks/
        │   └── useResizableColumns.js
        ├── layouts/
        │   └── MainLayout.jsx
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Users.jsx / FichaUsuario.jsx
        │   ├── Socios.jsx / FichaSocio.jsx
        │   ├── Therapists.jsx
        │   ├── Sessions.jsx
        │   ├── Facturacion.jsx
        │   ├── Servicios.jsx
        │   ├── Estadisticas.jsx
        │   ├── Importar.jsx
        │   └── Sepa.jsx
        ├── services/
        │   └── api.js
        └── utils/
            ├── pdfGenerator.js
            └── excelExport.js
```

---

## Instalación y arranque

### Con Docker (recomendado)

```bash
docker-compose up --build
```

La aplicación estará disponible en **http://localhost**

La primera vez tarda unos minutos en construir las imágenes. Las siguientes veces arranca en segundos con `docker-compose up`.

Para parar: `docker-compose down`
Para parar y borrar datos: `docker-compose down -v`

### Sin Docker (desarrollo local)

#### Requisitos
- Node.js 20+

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js      # Carga datos de ejemplo
node src/index.js        # Arranca en http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Arranca en http://localhost:5173
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
