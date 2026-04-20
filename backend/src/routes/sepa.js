const router = require("express").Router();
const prisma = require("../lib/prisma");

// Datos del acreedor (la asociación NORA)
// En producción estos vendrían de configuración/BD
const ACREEDOR = {
  nombre:  "Asociación NORA",
  iban:    process.env.NORA_IBAN    || "ES9121000418450200051332",
  bic:     process.env.NORA_BIC     || "CAIXESBBXXX",
  creditorId: process.env.NORA_CREDITOR_ID || "ES12ZZZ00000001",
};

// ─── Helpers XML ──────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function isoDateTime(d) {
  return new Date(d).toISOString().slice(0, 19);
}

function formatIBAN(iban) {
  return (iban || "").replace(/\s/g, "").toUpperCase();
}

// Genera un ID único para la remesa
function msgId(mes, anio) {
  return `NORA-${anio}${String(mes).padStart(2, "0")}-${Date.now()}`;
}

// ─── GET /api/sepa/preview?mes=4&anio=2026 ────────────────────────────────────
// Devuelve un preview de lo que incluiría la remesa (sin generar XML)
router.get("/preview", async (req, res) => {
  try {
    const { mes, anio } = req.query;
    if (!mes || !anio) return res.status(400).json({ error: "mes y anio son requeridos" });

    const data = await obtenerDatosRemesa(Number(mes), Number(anio));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/sepa/generar ───────────────────────────────────────────────────
// Genera y devuelve el fichero XML PAIN.008
router.post("/generar", async (req, res) => {
  try {
    const { mes, anio, fechaCobro } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: "mes y anio son requeridos" });

    const { lineas, sinIBAN, total } = await obtenerDatosRemesa(Number(mes), Number(anio));

    if (lineas.length === 0) {
      return res.status(400).json({ error: "No hay facturas pendientes con IBAN para este mes" });
    }

    const fechaCobroFinal = fechaCobro || isoDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)); // +5 días por defecto
    const xml = generarXMLPain008(lineas, Number(mes), Number(anio), fechaCobroFinal);

    const nombreFichero = `remesa_NORA_${anio}${String(mes).padStart(2, "0")}.xml`;

    res.setHeader("Content-Disposition", `attachment; filename="${nombreFichero}"`);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Lógica de negocio ────────────────────────────────────────────────────────

async function obtenerDatosRemesa(mes, anio) {
  // Facturas pendientes del mes
  const facturas = await prisma.factura.findMany({
    where: { mes, anio, estado: "pendiente" },
    include: {
      usuario: {
        select: {
          id: true, nombre: true, apellidos: true, dni: true,
          socioVinculadoId: true,
          socioVinculado: {
            select: {
              id: true, nombre: true, apellidos: true, dni: true,
              datosBancarios: true,
            },
          },
        },
      },
    },
  });

  const lineas   = [];
  const sinIBAN  = [];

  for (const f of facturas) {
    const socio = f.usuario.socioVinculado;
    const banc  = socio?.datosBancarios?.[0];
    const iban  = formatIBAN(banc?.iban);

    if (!iban) {
      sinIBAN.push({
        facturaId:  f.id,
        numRecibo:  f.numRecibo,
        usuario:    `${f.usuario.nombre} ${f.usuario.apellidos}`,
        socio:      socio ? `${socio.nombre} ${socio.apellidos}` : "Sin socio",
        total:      f.total,
        motivo:     socio ? "Socio sin IBAN" : "Sin socio vinculado",
      });
      continue;
    }

    lineas.push({
      facturaId:    f.id,
      numRecibo:    f.numRecibo,
      importe:      f.total,
      // Deudor = el socio que paga
      deudorNombre: `${socio.nombre} ${socio.apellidos}`,
      deudorDNI:    socio.dni || "",
      deudorIBAN:   iban,
      deudorBIC:    banc?.bic || "NOTPROVIDED",
      // Concepto
      concepto:     `NORA ${String(mes).padStart(2,"0")}/${anio} - ${f.usuario.nombre} ${f.usuario.apellidos}`,
      mandateId:    `NORA-${socio.id}`,          // ID del mandato de domiciliación
      mandateDate:  socio.fechaAlta ? isoDate(socio.fechaAlta) : "2015-01-01",
    });
  }

  const total = lineas.reduce((a, l) => a + l.importe, 0);

  return { lineas, sinIBAN, total, totalFacturas: facturas.length };
}

// ─── Generador XML PAIN.008.001.02 (SEPA Core Direct Debit) ──────────────────

function generarXMLPain008(lineas, mes, anio, fechaCobro) {
  const id        = msgId(mes, anio);
  const ahora     = isoDateTime(new Date());
  const numTxns   = lineas.length;
  const totalCtrl = lineas.reduce((a, l) => a + l.importe, 0).toFixed(2);

  const txns = lineas.map(l => `
        <DrctDbtTxInf>
          <PmtId>
            <EndToEndId>${esc(l.numRecibo)}</EndToEndId>
          </PmtId>
          <InstdAmt Ccy="EUR">${l.importe.toFixed(2)}</InstdAmt>
          <DrctDbtTx>
            <MndtRltdInf>
              <MndtId>${esc(l.mandateId)}</MndtId>
              <DtOfSgntr>${l.mandateDate}</DtOfSgntr>
            </MndtRltdInf>
          </DrctDbtTx>
          <DbtrAgt>
            <FinInstnId>
              ${l.deudorBIC && l.deudorBIC !== "NOTPROVIDED"
                ? `<BIC>${esc(l.deudorBIC)}</BIC>`
                : `<Othr><Id>NOTPROVIDED</Id></Othr>`
              }
            </FinInstnId>
          </DbtrAgt>
          <Dbtr>
            <Nm>${esc(l.deudorNombre)}</Nm>
          </Dbtr>
          <DbtrAcct>
            <Id>
              <IBAN>${esc(l.deudorIBAN)}</IBAN>
            </Id>
          </DbtrAcct>
          <RmtInf>
            <Ustrd>${esc(l.concepto)}</Ustrd>
          </RmtInf>
        </DrctDbtTxInf>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${esc(id)}</MsgId>
      <CreDtTm>${ahora}</CreDtTm>
      <NbOfTxs>${numTxns}</NbOfTxs>
      <CtrlSum>${totalCtrl}</CtrlSum>
      <InitgPty>
        <Nm>${esc(ACREEDOR.nombre)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${esc(id)}-001</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${numTxns}</NbOfTxs>
      <CtrlSum>${totalCtrl}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>RCUR</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${fechaCobro}</ReqdColltnDt>
      <Cdtr>
        <Nm>${esc(ACREEDOR.nombre)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${esc(ACREEDOR.iban)}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${esc(ACREEDOR.bic)}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${esc(ACREEDOR.creditorId)}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>${txns}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
}

module.exports = router;
