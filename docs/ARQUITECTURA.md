# 🏗 Arquitectura Técnica

Documentación técnica del sistema.

---

## 📐 Estructura General

```
┌─────────────────────────────────────┐
│      FRONTEND (React)               │
│  - Interfaz de usuario              │
│  - Validación básica                │
│  - Generación de PDFs               │
└──────────────┬──────────────────────┘
               │ HTTP/REST (JSON)
┌──────────────▼──────────────────────┐
│    BACKEND (Node.js/Express)        │
│  - API REST                         │
│  - Lógica de negocio                │
│  - Validación Zod                   │
│  - Autenticación JWT                │
└──────────────┬──────────────────────┘
               │ Prisma ORM (SQL)
┌──────────────▼──────────────────────┐
│    BASE DE DATOS (SQLite)           │
│  - Almacenamiento                   │
│  - Migraciones                      │
└─────────────────────────────────────┘
```

---

## 🎨 Frontend

### Tecnologías

- React 19 + Vite
- React Router 7
- Tailwind CSS
- Heroicons
- Recharts (gráficos)
- jsPDF (PDFs)
- XLSX (Excel)

### Estructura

```
frontend/src/
├── pages/              # Páginas principales
├── components/         # Componentes reutilizables
├── context/            # Context API (Auth)
├── hooks/              # Custom hooks
├── services/           # Cliente API (Axios)
├── utils/              # Utilidades
└── layouts/            # Layouts compartidos
```

### Gestión de Estado

- **Local:** `useState` para formularios
- **Global:** Context API para autenticación
- **Server:** Peticiones directas con Axios

---

## ⚙️ Backend

### Tecnologías

- Node.js 20+
- Express 4
- Prisma 5 (ORM)
- SQLite 3
- Zod 4 (validación)
- bcryptjs (contraseñas)
- jsonwebtoken (JWT)
- Jest 30 (tests)

### Estructura

```
backend/src/
├── routes/             # Endpoints REST
│   ├── auth.js
│   ├── usuarios.js
│   ├── socios.js
│   ├── terapeutas.js
│   ├── servicios.js
│   ├── sesiones.js
│   ├── facturas.js
│   ├── sepa.js
│   ├── estadisticas.js
│   ├── horarios.js
│   ├── avisos.js
│   └── importar.js
├── lib/                # Librerías
│   ├── prisma.js
│   ├── schemas.js      # Validaciones Zod
│   └── descuento.js    # Lógica descuentos
└── index.js            # Servidor Express
```

### API REST

Convenciones estándar:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/usuarios` | Listar |
| `GET` | `/api/usuarios/:id` | Obtener uno |
| `POST` | `/api/usuarios` | Crear |
| `PUT` | `/api/usuarios/:id` | Actualizar |
| `DELETE` | `/api/usuarios/:id` | Eliminar |

### Validación

Todos los endpoints validan con Zod:

```javascript
const UsuarioSchema = z.object({
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: z.string().regex(/^[0-9]{8}[A-Z]$/).optional(),
  email: z.string().email().optional(),
  // ...
});

router.post("/", validate(UsuarioSchema), async (req, res) => {
  // req.body ya validado
});
```

### Autenticación

JWT con expiración de 7 días:

```javascript
// Login
const token = jwt.sign({ userId, rol }, JWT_SECRET);

// Middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
};
```

### Lógica de Negocio

**Descuento del 10%:**

```javascript
function calcularDescuento(subtotal, subtotalHermano = null) {
  // Individual: >120€
  if (subtotal > 120) return subtotal * 0.1;
  
  // Hermanos: suma de 2 facturas >120€
  if (subtotalHermano !== null && subtotal + subtotalHermano > 120) {
    return subtotal * 0.1;
  }
  
  return 0;
}
```

**Numeración de recibos:**

```javascript
// Último recibo del año
const ultima = await prisma.factura.findFirst({
  where: { anio },
  orderBy: { numRecibo: "desc" }
});

// Siguiente número
let seq = 1;
if (ultima) {
  const match = ultima.numRecibo.match(/^(\d+)\//);
  if (match) seq = parseInt(match[1]) + 1;
}

const numRecibo = `${String(seq).padStart(2, "0")}/${anio}`;
```

---

## 🗄 Base de Datos

### Modelo Principal

```prisma
model Usuario {
  id                    Int
  nombre                String
  apellidos             String
  dni                   String?
  diagnostico           String?
  porcentajeDiscapacidad Float?
  socioVinculadoId      Int?
  baja                  Boolean
  
  sesiones              Sesion[]
  facturas              Factura[]
  avisos                Aviso[]
}

model Sesion {
  id           Int
  usuarioId    Int
  terapeutaId  Int
  servicioId   Int
  fecha        DateTime
  estado       String
  cobrable     Boolean
}

model Factura {
  id            Int
  numRecibo     String
  usuarioId     Int
  mes           Int
  anio          Int
  subtotal      Float
  descuento     Float
  total         Float
  estado        String
  
  lineas        LineaFactura[]
}
```

### Relaciones

- Usuario → N Sesiones
- Usuario → N Facturas
- Usuario → 1 Socio (vinculado)
- Sesión → 1 Usuario, 1 Terapeuta, 1 Servicio
- Factura → N Líneas → 1 Servicio

### Migraciones

```bash
# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Resetear BD
npx prisma migrate reset
```

---

## 🔒 Seguridad

- **JWT** con expiración de 7 días
- **Contraseñas** hasheadas con bcrypt
- **Validación** en backend con Zod
- **CORS** configurado
- **SQL injection** prevenido por Prisma

---

## 🧪 Tests

```bash
cd backend
npm test
```

39 tests:
- Lógica de descuentos (12)
- Numeración de recibos (6)
- Validaciones Zod (21)

---

## 📦 Despliegue

### Docker

```bash
docker compose up --build
```

### Producción

Recomendaciones:
- Migrar a PostgreSQL/MySQL
- Backend: Railway, Render, Fly.io
- Frontend: Vercel, Netlify
- HTTPS obligatorio
- Backups automáticos

---

## 🔮 Mejoras Futuras

- Migrar a PostgreSQL
- Añadir TypeScript
- Sistema de backups automáticos
- Auditoría de cambios
- Notificaciones por email
- App móvil

---

<div align="center">

[⬆ Volver al README](../README.md)

</div>
