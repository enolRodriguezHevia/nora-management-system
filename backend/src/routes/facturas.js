const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/facturas
router.get("/", async (req, res) => {
  try {
    const { mes, anio, usuarioId, estado } = req.query;
    const facturas = await prisma.factura.findMany({
      where: {
        ...(mes      && { mes:       Number(mes) }),
        ...(anio     && { anio:      Number(anio) }),
        ...(usuarioId && { usuarioId: Number(usuarioId) }),
        ...(estado   && { estado }),
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellidos: true, direccion: true, cp: true, poblacion: true, dni: true } },
        lineas:  { include: { servicio: true } },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });
    res.json(facturas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facturas/:id
router.get("/:id", async (req, res) => {
  try {
    const factura = await prisma.factura.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        usuario: true,
        lineas: { include: { servicio: true } },
      },
    });
    if (!factura) return res.status(404).json({ error: "Factura no encontrada" });
    res.json(factura);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facturas/generar — genera factura automáticamente desde sesiones del mes
router.post("/generar", async (req, res) => {
  try {
    const { usuarioId, mes, anio } = req.body;

    // Verificar si ya existe
    const existe = await prisma.factura.findFirst({ where: { usuarioId, mes, anio } });
    if (existe) return res.status(400).json({ error: "Ya existe una factura para este usuario y mes" });

    // Obtener sesiones cobrables del mes
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin    = new Date(anio, mes, 0, 23, 59, 59);

    const sesiones = await prisma.sesion.findMany({
      where: { usuarioId, cobrable: true, fecha: { gte: fechaInicio, lte: fechaFin } },
      include: { servicio: true },
    });

    if (sesiones.length === 0) {
      return res.status(400).json({ error: "No hay sesiones cobrables para este mes" });
    }

    // Agrupar por servicio
    const agrupado = {};
    for (const s of sesiones) {
      const key = s.servicioId;
      if (!agrupado[key]) agrupado[key] = { servicio: s.servicio, count: 0 };
      agrupado[key].count++;
    }

    const lineas = Object.values(agrupado).map((g) => ({
      servicioId:   g.servicio.id,
      numSesiones:  g.count,
      precioSesion: g.servicio.precio,
      suma:         g.count * g.servicio.precio,
    }));

    const subtotal = lineas.reduce((acc, l) => acc + l.suma, 0);

    // ── Lógica de descuento ──────────────────────────────────────────────────
    // Regla 1: descuento si el recibo individual supera 120€
    // Regla 2: descuento si la suma con el recibo de un hermano/a supera 120€
    //          (hermano = usuario con el mismo socioVinculadoId)
    let aplicarDescuento = subtotal > 120;

    if (!aplicarDescuento) {
      // Buscar si este usuario tiene socio vinculado
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { socioVinculadoId: true },
      });

      if (usuario?.socioVinculadoId) {
        // Buscar hermanos: otros usuarios con el mismo socioVinculadoId
        const hermanos = await prisma.usuario.findMany({
          where: {
            socioVinculadoId: usuario.socioVinculadoId,
            id: { not: usuarioId },
          },
          select: { id: true },
        });

        if (hermanos.length > 0) {
          // Buscar facturas de hermanos en el mismo mes
          const facturasHermanos = await prisma.factura.findMany({
            where: {
              usuarioId: { in: hermanos.map(h => h.id) },
              mes,
              anio,
            },
            select: { id: true, subtotal: true, descuento: true },
          });

          if (facturasHermanos.length > 0) {
            const sumaHermano = facturasHermanos.reduce((acc, f) => acc + f.subtotal, 0);
            if (subtotal + sumaHermano > 120) {
              aplicarDescuento = true;

              // Aplicar también el descuento retroactivamente a las facturas del hermano
              // que aún no lo tenían aplicado
              for (const fh of facturasHermanos) {
                if (fh.descuento === 0) {
                  await prisma.factura.update({
                    where: { id: fh.id },
                    data: {
                      descuento: fh.subtotal * 0.1,
                      total:     fh.subtotal * 0.9,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    const descuento = aplicarDescuento ? subtotal * 0.1 : 0;
    const total     = subtotal - descuento;
    
    // Generar número de recibo secuencial por año (formato: XX/YYYY)
    const ultimaFacturaAnio = await prisma.factura.findFirst({
      where: { anio },
      orderBy: { numRecibo: 'desc' },
      select: { numRecibo: true }
    });
    
    let numeroSecuencial = 1;
    if (ultimaFacturaAnio) {
      // Extraer el número secuencial del formato "XX/YYYY"
      const match = ultimaFacturaAnio.numRecibo.match(/^(\d+)\//);
      if (match) {
        numeroSecuencial = parseInt(match[1]) + 1;
      }
    }
    
    const numRecibo = `${String(numeroSecuencial).padStart(2, "0")}/${anio}`;

    const factura = await prisma.factura.create({
      data: {
        numRecibo,
        usuarioId,
        mes,
        anio,
        subtotal,
        descuento,
        total,
        lineas: { create: lineas },
      },
      include: { usuario: true, lineas: { include: { servicio: true } } },
    });

    res.status(201).json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/facturas/generar-masivo — genera facturas para todos los usuarios con sesiones cobrables
router.post("/generar-masivo", async (req, res) => {
  try {
    const { mes, anio } = req.body;

    if (!mes || !anio) {
      return res.status(400).json({ error: "Mes y año son requeridos" });
    }

    // Obtener todos los usuarios activos con sesiones cobrables en el mes
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin    = new Date(anio, mes, 0, 23, 59, 59);

    const sesiones = await prisma.sesion.findMany({
      where: { 
        cobrable: true, 
        fecha: { gte: fechaInicio, lte: fechaFin } 
      },
      include: { 
        servicio: true,
        usuario: { select: { id: true, nombre: true, apellidos: true, baja: true } }
      },
    });

    // Agrupar por usuario
    const usuariosConSesiones = {};
    for (const s of sesiones) {
      if (s.usuario.baja) continue; // Saltar usuarios dados de baja
      
      const uid = s.usuarioId;
      if (!usuariosConSesiones[uid]) {
        usuariosConSesiones[uid] = {
          usuario: s.usuario,
          sesiones: []
        };
      }
      usuariosConSesiones[uid].sesiones.push(s);
    }

    const usuarioIds = Object.keys(usuariosConSesiones).map(Number);

    if (usuarioIds.length === 0) {
      return res.status(400).json({ error: "No hay usuarios con sesiones cobrables para este mes" });
    }

    // Verificar cuáles ya tienen factura
    const facturasExistentes = await prisma.factura.findMany({
      where: { mes, anio, usuarioId: { in: usuarioIds } },
      select: { usuarioId: true },
    });

    const usuariosConFactura = new Set(facturasExistentes.map(f => f.usuarioId));
    const usuariosPendientes = usuarioIds.filter(uid => !usuariosConFactura.has(uid));

    if (usuariosPendientes.length === 0) {
      return res.status(400).json({ 
        error: "Todos los usuarios ya tienen factura generada para este mes",
        yaGeneradas: usuariosConFactura.size
      });
    }

    // Generar facturas para cada usuario pendiente
    const facturasGeneradas = [];
    const errores = [];

    for (const uid of usuariosPendientes) {
      try {
        const { sesiones: sesionesusuario } = usuariosConSesiones[uid];
        
        // Agrupar por servicio
        const agrupado = {};
        for (const s of sesionesusuario) {
          const key = s.servicioId;
          if (!agrupado[key]) agrupado[key] = { servicio: s.servicio, count: 0 };
          agrupado[key].count++;
        }

        const lineas = Object.values(agrupado).map((g) => ({
          servicioId:   g.servicio.id,
          numSesiones:  g.count,
          precioSesion: g.servicio.precio,
          suma:         g.count * g.servicio.precio,
        }));

        const subtotal = lineas.reduce((acc, l) => acc + l.suma, 0);

        // Lógica de descuento (igual que en generar individual)
        let aplicarDescuento = subtotal > 120;

        if (!aplicarDescuento) {
          const usuario = await prisma.usuario.findUnique({
            where: { id: uid },
            select: { socioVinculadoId: true },
          });

          if (usuario?.socioVinculadoId) {
            const hermanos = await prisma.usuario.findMany({
              where: {
                socioVinculadoId: usuario.socioVinculadoId,
                id: { not: uid },
              },
              select: { id: true },
            });

            if (hermanos.length > 0) {
              const facturasHermanos = await prisma.factura.findMany({
                where: {
                  usuarioId: { in: hermanos.map(h => h.id) },
                  mes,
                  anio,
                },
                select: { id: true, subtotal: true, descuento: true },
              });

              if (facturasHermanos.length > 0) {
                const sumaHermano = facturasHermanos.reduce((acc, f) => acc + f.subtotal, 0);
                if (subtotal + sumaHermano > 120) {
                  aplicarDescuento = true;

                  for (const fh of facturasHermanos) {
                    if (fh.descuento === 0) {
                      await prisma.factura.update({
                        where: { id: fh.id },
                        data: {
                          descuento: fh.subtotal * 0.1,
                          total:     fh.subtotal * 0.9,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }

        const descuento = aplicarDescuento ? subtotal * 0.1 : 0;
        const total     = subtotal - descuento;
        
        // Generar número de recibo secuencial por año (formato: XX/YYYY)
        const ultimaFacturaAnio = await prisma.factura.findFirst({
          where: { anio },
          orderBy: { numRecibo: 'desc' },
          select: { numRecibo: true }
        });
        
        let numeroSecuencial = 1;
        if (ultimaFacturaAnio) {
          // Extraer el número secuencial del formato "XX/YYYY"
          const match = ultimaFacturaAnio.numRecibo.match(/^(\d+)\//);
          if (match) {
            numeroSecuencial = parseInt(match[1]) + 1;
          }
        }
        
        const numRecibo = `${String(numeroSecuencial).padStart(2, "0")}/${anio}`;

        const factura = await prisma.factura.create({
          data: {
            numRecibo,
            usuarioId: uid,
            mes,
            anio,
            subtotal,
            descuento,
            total,
            lineas: { create: lineas },
          },
          include: { usuario: true, lineas: { include: { servicio: true } } },
        });

        facturasGeneradas.push(factura);
      } catch (error) {
        errores.push({
          usuarioId: uid,
          usuario: usuariosConSesiones[uid].usuario.nombre + " " + usuariosConSesiones[uid].usuario.apellidos,
          error: error.message
        });
      }
    }

    res.status(201).json({
      generadas: facturasGeneradas.length,
      yaExistian: usuariosConFactura.size,
      errores: errores.length,
      detalleErrores: errores,
      facturas: facturasGeneradas
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/facturas/:id/estado
router.put("/:id/estado", async (req, res) => {
  try {
    const factura = await prisma.factura.update({
      where: { id: Number(req.params.id) },
      data: { estado: req.body.estado },
    });
    res.json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
