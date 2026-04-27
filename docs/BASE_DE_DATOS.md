# 🗄️ Diagrama de Base de Datos

Esquema completo de la base de datos del sistema.

---

## 📊 Diagrama Entidad-Relación

```
┌─────────────────────┐
│   UserSistema       │
│─────────────────────│
│ id (PK)             │
│ username (unique)   │
│ password            │
│ nombre              │
│ rol                 │
│ terapeutaId (FK)    │
└─────────────────────┘
          │
          │ 1:1
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Terapeuta         │         │   Servicio          │
│─────────────────────│         │─────────────────────│
│ id (PK)             │         │ id (PK)             │
│ nombre              │         │ nombre              │
│ apellidos           │         │ categoria           │
│ especialidad        │         │ precio              │
│ email               │         │ activo              │
│ telefono            │         └─────────────────────┘
│ activo              │                   │
└─────────────────────┘                   │
          │                               │
          │ 1:N                           │
          ▼                               │
┌─────────────────────┐                   │
│   Sesion            │◄──────────────────┘
│─────────────────────│         1:N
│ id (PK)             │
│ usuarioId (FK)      │
│ terapeutaId (FK)    │
│ servicioId (FK)     │
│ fecha               │
│ estado              │
│ cobrable            │
│ actividadRealizada  │
│ observaciones       │
└─────────────────────┘
          ▲
          │ N:1
          │
┌─────────────────────┐         ┌─────────────────────┐
│   Usuario           │         │   Socio             │
│─────────────────────│         │─────────────────────│
│ id (PK)             │    ┌───►│ id (PK)             │
│ nombre              │    │    │ numSocio (unique)   │
│ apellidos           │    │    │ nombre              │
│ dni                 │    │    │ apellidos           │
│ fechaNacimiento     │    │    │ dni                 │
│ direccion           │    │    │ direccion           │
│ poblacion           │    │    │ poblacion           │
│ cp                  │    │    │ cp                  │
│ provincia           │    │    │ provincia           │
│ telefono            │    │    │ telefono            │
│ email               │    │    │ telefono2           │
│ diagnostico         │    │    │ email               │
│ porcentajeDiscap.   │    │    │ tipologia           │
│ grado               │    │    │ fechaAlta           │
│ centroAlQueAcude    │    │    │ baja                │
│ socioVinculadoId ───┼────┘    └─────────────────────┘
│ socioVinculado2Id ──┼────┐              │
│ fechaAlta           │    │              │ 1:N
│ baja                │    │              ▼
└─────────────────────┘    │    ┌─────────────────────┐
          │                └───►│ SocioBancario       │
          │ 1:N                 │─────────────────────│
          ▼                     │ id (PK)             │
┌─────────────────────┐         │ socioId (FK)        │
│   UsuarioBancario   │         │ iban                │
│─────────────────────│         │ bic                 │
│ id (PK)             │         │ entidadBancaria     │
│ usuarioId (FK)      │         │ cadencia            │
│ iban                │         │ cuota               │
│ bic                 │         └─────────────────────┘
│ entidadBancaria     │
│ titular             │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│   Factura           │
│─────────────────────│
│ id (PK)             │
│ numRecibo (unique)  │
│ usuarioId (FK)      │
│ mes                 │
│ anio                │
│ fecha               │
│ subtotal            │
│ descuento           │
│ total               │
│ estado              │
│ sesionesSnapshot    │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│   LineaFactura      │
│─────────────────────│
│ id (PK)             │
│ facturaId (FK)      │
│ servicioId (FK)     │
│ numSesiones         │
│ precioSesion        │
│ suma                │
└─────────────────────┘

┌─────────────────────┐
│   Aviso             │
│─────────────────────│
│ id (PK)             │
│ usuarioId (FK)      │
│ texto               │
│ resuelto            │
│ createdAt           │
└─────────────────────┘

┌─────────────────────┐
│   HorarioHabitual   │
│─────────────────────│
│ id (PK)             │
│ usuarioId (FK)      │
│ terapeutaId (FK)    │
│ servicioId (FK)     │
│ diaSemana (1-5)     │
│ activo              │
└─────────────────────┘
```

---

## 📋 Tablas Principales

### UserSistema
Usuarios del sistema (admin y terapeutas).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `username` | String | Usuario de acceso (único) |
| `password` | String | Contraseña hasheada |
| `nombre` | String | Nombre completo |
| `rol` | String | `admin` o `terapeuta` |
| `terapeutaId` | Int? | FK a Terapeuta (si rol=terapeuta) |

### Terapeuta
Profesionales que atienden a los usuarios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `nombre` | String | Nombre |
| `apellidos` | String | Apellidos |
| `especialidad` | String | Logopedia, Psicología, Fisioterapia, T.O. |
| `email` | String? | Email de contacto |
| `telefono` | String? | Teléfono |
| `activo` | Boolean | Si está activo |

### Usuario
Personas con discapacidad que reciben los servicios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `nombre` | String | Nombre |
| `apellidos` | String | Apellidos |
| `dni` | String? | DNI/NIE |
| `fechaNacimiento` | DateTime? | Fecha de nacimiento |
| `diagnostico` | String? | Diagnóstico médico |
| `porcentajeDiscapacidad` | Float? | % de discapacidad |
| `grado` | String? | Grado I, II o III |
| `socioVinculadoId` | Int? | FK a Socio principal |
| `socioVinculado2Id` | Int? | FK a Socio secundario |
| `fechaAlta` | DateTime? | Fecha de alta |
| `baja` | Boolean | Si está de baja |

### Socio
Familiares o colaboradores que pagan las cuotas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `numSocio` | String | Número de socio (único) |
| `nombre` | String | Nombre |
| `apellidos` | String | Apellidos |
| `dni` | String? | DNI/NIE |
| `tipologia` | String? | Afectado o Colaborador |
| `fechaAlta` | DateTime? | Fecha de alta |
| `baja` | Boolean | Si está de baja |

### Servicio
Tratamientos y actividades que se ofrecen.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `nombre` | String | Nombre del servicio |
| `categoria` | String | Categoría (Tratamiento Individual, Aula, etc.) |
| `precio` | Float | Precio por sesión |
| `activo` | Boolean | Si está activo |

### Sesion
Registro de cada sesión realizada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `usuarioId` | Int | FK a Usuario |
| `terapeutaId` | Int | FK a Terapeuta |
| `servicioId` | Int | FK a Servicio |
| `fecha` | DateTime | Fecha de la sesión |
| `estado` | String | programada, asistio, falta, festivo, etc. |
| `cobrable` | Boolean | Si se cobra o no |
| `actividadRealizada` | String? | Descripción de la actividad |
| `observaciones` | String? | Notas adicionales |

### Factura
Facturas mensuales generadas desde sesiones.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `numRecibo` | String | Número de recibo (único) |
| `usuarioId` | Int | FK a Usuario |
| `mes` | Int | Mes (1-12) |
| `anio` | Int | Año |
| `fecha` | DateTime | Fecha de emisión |
| `subtotal` | Float | Suma antes de descuento |
| `descuento` | Float | Descuento aplicado |
| `total` | Float | Total a pagar |
| `estado` | String | pendiente, cobrada, anulada |
| `sesionesSnapshot` | Json? | Snapshot de sesiones |

### LineaFactura
Líneas de detalle de cada factura.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `facturaId` | Int | FK a Factura |
| `servicioId` | Int | FK a Servicio |
| `numSesiones` | Int | Cantidad de sesiones |
| `precioSesion` | Float | Precio unitario |
| `suma` | Float | Subtotal de la línea |

### HorarioHabitual
Horarios semanales fijos de cada usuario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `usuarioId` | Int | FK a Usuario |
| `terapeutaId` | Int | FK a Terapeuta |
| `servicioId` | Int | FK a Servicio |
| `diaSemana` | Int | 1=Lunes, 2=Martes, ..., 5=Viernes |
| `activo` | Boolean | Si está activo |

### Aviso
Notas y recordatorios sobre usuarios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Identificador único |
| `usuarioId` | Int | FK a Usuario |
| `texto` | String | Contenido del aviso |
| `resuelto` | Boolean | Si está resuelto |
| `createdAt` | DateTime | Fecha de creación |

---

## 🔑 Relaciones Principales

- **Usuario → Socio**: Un usuario puede tener 1 o 2 socios vinculados (padres/tutores)
- **Usuario → Sesion**: Un usuario tiene muchas sesiones
- **Usuario → Factura**: Un usuario tiene muchas facturas
- **Terapeuta → Sesion**: Un terapeuta realiza muchas sesiones
- **Servicio → Sesion**: Un servicio se usa en muchas sesiones
- **Factura → LineaFactura**: Una factura tiene muchas líneas de detalle
- **Socio → SocioBancario**: Un socio puede tener datos bancarios

---

## 📐 Índices y Constraints

### Índices Únicos
- `UserSistema.username`
- `Socio.numSocio`
- `Factura.numRecibo`

### Índices Compuestos
- `Factura(usuarioId, mes, anio)` - Para búsquedas rápidas de facturas por usuario y período
- `Sesion(usuarioId, fecha)` - Para búsquedas de sesiones por usuario y fecha
- `HorarioHabitual(usuarioId, terapeutaId, servicioId, diaSemana)` - Para evitar duplicados

### Constraints
- `Sesion.estado` - Enum con 7 valores válidos
- `Factura.estado` - Enum con 3 valores válidos
- `Socio.tipologia` - Enum: Afectado, Colaborador
- `Usuario.grado` - Enum: Grado I, Grado II, Grado III
- `Terapeuta.especialidad` - Enum: Logopedia, Psicología, Fisioterapia, Terapia Ocupacional

---

## 🔄 Migraciones

El esquema se gestiona con **Prisma Migrate**:

```bash
# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (desarrollo)
npx prisma migrate reset
```

---

## 📊 Estadísticas de la Base de Datos

Con los datos de ejemplo incluidos:

| Tabla | Registros |
|---|---|
| UserSistema | 5 |
| Terapeuta | 4 |
| Servicio | 13 |
| Socio | 16 |
| Usuario | 24 |
| Sesion | ~1045 |
| Factura | 32 |
| LineaFactura | ~96 |
| HorarioHabitual | 120 |
| Aviso | 6 |
| SocioBancario | 14 |
| UsuarioBancario | 0 |

---

<div align="center">

[⬆ Volver al README](../README.md)

</div>
