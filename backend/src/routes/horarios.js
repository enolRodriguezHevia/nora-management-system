const router = require("express").Router();
const prisma  = require("../lib/prisma");

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// GET /api/horarios?usuarioId=1&terapeutaId=1
router.get("/", async (req, res) => {
  try {
    const { usuarioId, terapeutaId } = req.query;
    const horarios = await prisma.horarioHabitual.findMany({
      where: {
        activo: true,
        ...(usuarioId   && { usuarioId:   Number(usuarioId) }),
        ...(terapeutaId && { terapeutaId: Number(terapeutaId) }),
      },
      include: {
        usuario:   { select: { id: true, nombre: true, apellidos: true } },
        terapeuta: { select: { id: true, nombre: true, apellidos: true, especialidad: true } },
        servicio:  { select: { id: true, nombre: true, categoria: true } },
      },
      orderBy: [{ terapeutaId: "asc" }, { diaSemana: "asc" }, { usuarioId: "asc" }],
    });
    res.json(horarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/horarios
router.post("/", async (req, res) => {
  try {
    const { usuarioId, terapeutaId, servicioId, diaSemana } = req.body;
    if (!usuarioId || !terapeutaId || !servicioId || !diaSemana) {
      return res.status(400).json({ error: "usuarioId, terapeutaId, servicioId y diaSemana son obligatorios" });
    }
    if (diaSemana < 1 || diaSemana > 5) {
      return res.status(400).json({ error: "diaSemana debe ser entre 1 (Lunes) y 5 (Viernes)" });
    }
    // Evitar duplicados
    const existe = await prisma.horarioHabitual.findFirst({
      where: { usuarioId: Number(usuarioId), terapeutaId: Number(terapeutaId), servicioId: Number(servicioId), diaSemana: Number(diaSemana), activo: true },
    });
    if (existe) return res.status(400).json({ error: "Ya existe este horario habitual" });

    const horario = await prisma.horarioHabitual.create({
      data: {
        usuarioId:   Number(usuarioId),
        terapeutaId: Number(terapeutaId),
        servicioId:  Number(servicioId),
        diaSemana:   Number(diaSemana),
      },
      include: {
        usuario:   { select: { id: true, nombre: true, apellidos: true } },
        terapeuta: { select: { id: true, nombre: true, apellidos: true, especialidad: true } },
        servicio:  { select: { id: true, nombre: true, categoria: true } },
      },
    });
    res.status(201).json(horario);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/horarios/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.horarioHabitual.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    });
    res.json({ message: "Horario eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/horarios/generar-curso — genera sesiones para un rango de meses
router.post("/generar-curso", async (req, res) => {
  try {
    const { mesDesde, anioDesde, mesHasta, anioHasta } = req.body;
    if (!mesDesde || !anioDesde || !mesHasta || !anioHasta) {
      return res.status(400).json({ error: "mesDesde, anioDesde, mesHasta y anioHasta son obligatorios" });
    }

    // Construir lista de meses en el rango
    const meses = [];
    let m = Number(mesDesde), a = Number(anioDesde);
    const mFin = Number(mesHasta), aFin = Number(anioHasta);
    while (a < aFin || (a === aFin && m <= mFin)) {
      meses.push({ mes: m, anio: a });
      m++;
      if (m > 12) { m = 1; a++; }
      if (meses.length > 24) break; // máximo 2 años de seguridad
    }

    if (meses.length === 0) return res.status(400).json({ error: "El rango de fechas no es válido" });

    const horarios = await prisma.horarioHabitual.findMany({
      where: { activo: true },
      include: {
        usuario:   { select: { id: true, baja: true } },
        terapeuta: { select: { id: true } },
        servicio:  { select: { id: true } },
      },
    });

    const horariosActivos = horarios.filter(h => !h.usuario.baja);
    let totalCreadas = 0;
    let totalExistian = 0;

    for (const { mes, anio } of meses) {
      const totalDias = new Date(anio, mes, 0).getDate();
      for (let d = 1; d <= totalDias; d++) {
        const dow = new Date(anio, mes - 1, d).getDay();
        const diaSemana = dow === 0 ? 7 : dow;
        if (diaSemana < 1 || diaSemana > 5) continue;
        const fecha = new Date(Date.UTC(anio, mes - 1, d));

        for (const horario of horariosActivos) {
          if (diaSemana !== horario.diaSemana) continue;
          const existe = await prisma.sesion.findFirst({
            where: { usuarioId: horario.usuarioId, terapeutaId: horario.terapeutaId, fecha },
          });
          if (existe) { totalExistian++; continue; }
          await prisma.sesion.create({
            data: {
              usuarioId:   horario.usuarioId,
              terapeutaId: horario.terapeutaId,
              servicioId:  horario.servicioId,
              fecha, estado: "programada", cobrable: false,
            },
          });
          totalCreadas++;
        }
      }
    }

    const ML = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    res.json({
      creadas: totalCreadas, yaExistian: totalExistian,
      meses: meses.length,
      rango: `${ML[mesDesde]} ${anioDesde} → ${ML[mesHasta]} ${anioHasta}`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.post("/generar-mes", async (req, res) => {
  try {
    const { mes, anio } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: "mes y anio son obligatorios" });

    const horarios = await prisma.horarioHabitual.findMany({
      where: { activo: true },
      include: {
        usuario:   { select: { id: true, baja: true } },
        terapeuta: { select: { id: true } },
        servicio:  { select: { id: true } },
      },
    });

    // Filtrar usuarios activos
    const horariosActivos = horarios.filter(h => !h.usuario.baja);

    // Obtener todos los días del mes que correspondan al diaSemana de cada horario
    const diasDelMes = [];
    const totalDias = new Date(anio, mes, 0).getDate();
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(anio, mes - 1, d);
      const dow = fecha.getDay(); // 0=Dom, 1=Lun...6=Sab
      // Convertir: 1=Lun→1, 2=Mar→2... 5=Vie→5
      const diaSemana = dow === 0 ? 7 : dow; // 7=Domingo (no se usa)
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasDelMes.push({ dia: d, diaSemana, fecha: new Date(Date.UTC(anio, mes - 1, d)) });
      }
    }

    let creadas = 0;
    let yaExistian = 0;

    for (const horario of horariosActivos) {
      const diasCorrespondientes = diasDelMes.filter(d => d.diaSemana === horario.diaSemana);

      for (const { fecha } of diasCorrespondientes) {
        // Verificar si ya existe sesión ese día para ese usuario/terapeuta
        const existe = await prisma.sesion.findFirst({
          where: {
            usuarioId:   horario.usuarioId,
            terapeutaId: horario.terapeutaId,
            fecha,
          },
        });

        if (existe) {
          yaExistian++;
          continue;
        }

        await prisma.sesion.create({
          data: {
            usuarioId:   horario.usuarioId,
            terapeutaId: horario.terapeutaId,
            servicioId:  horario.servicioId,
            fecha,
            estado:   "programada",
            cobrable: false,
          },
        });
        creadas++;
      }
    }

    res.json({
      creadas,
      yaExistian,
      mensaje: `${creadas} sesiones programadas generadas para ${DIAS[0] || mes}/${anio}`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
