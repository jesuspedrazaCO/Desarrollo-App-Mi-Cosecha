import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ── Paleta de colores ──
const C = {
  green:      [21, 128, 61],
  greenLight: [220, 252, 231],
  greenDark:  [14, 86, 41],
  orange:     [194, 65, 12],
  orangeLight:[255, 237, 213],
  red:        [185, 28, 28],
  redLight:   [254, 226, 226],
  gray:       [107, 114, 128],
  grayLight:  [243, 244, 246],
  dark:       [17, 24, 39],
  white:      [255, 255, 255],
}

const formatCOP = (val = 0) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0)

const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(String(d).split('T')[0] + 'T12:00:00')
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Dibuja un ícono de hoja/planta vectorial (reemplaza el emoji 🌾) ──
const drawLeafIcon = (doc, cx, cy, scale = 1) => {
  doc.setFillColor(...C.green)

  // Tallo central
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.8 * scale)
  doc.line(cx, cy + 4 * scale, cx, cy - 5 * scale)

  // Hojas (triángulos curvos simples a cada lado)
  doc.setFillColor(...C.green)
  // Hoja izquierda
  doc.triangle(
    cx, cy - 1 * scale,
    cx - 4 * scale, cy - 3 * scale,
    cx, cy - 4 * scale,
    'F'
  )
  // Hoja derecha
  doc.triangle(
    cx, cy - 1 * scale,
    cx + 4 * scale, cy - 3 * scale,
    cx, cy - 4 * scale,
    'F'
  )
  // Punta superior
  doc.circle(cx, cy - 5.5 * scale, 1 * scale, 'F')
}

// ── Header decorativo (logo vectorial, no emoji) ──
const drawHeader = (doc, title, subtitle, user) => {
  const pw = doc.internal.pageSize.width

  // Franja verde superior
  doc.setFillColor(...C.green)
  doc.rect(0, 0, pw, 32, 'F')

  // Círculo blanco con ícono vectorial dentro
  doc.setFillColor(...C.white)
  doc.circle(20, 16, 9, 'F')
  drawLeafIcon(doc, 20, 17, 1)

  // Título
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('AgroFinanzas', 34, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(user?.farmName || 'Mi Finca', 34, 20)

  // Título del reporte (derecha)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pw - 14, 13, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, pw - 14, 20, { align: 'right' })

  // Línea decorativa
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.5)
  doc.line(14, 36, pw - 14, 36)

  return 44
}

// ── Footer ──
const drawFooter = (doc) => {
  const pw = doc.internal.pageSize.width
  const ph = doc.internal.pageSize.height
  const pages = doc.internal.getNumberOfPages()

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...C.grayLight)
    doc.setLineWidth(0.3)
    doc.line(14, ph - 16, pw - 14, ph - 16)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text('AgroFinanzas - Gestion financiera para tu finca', 14, ph - 10)
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-CO')} - Pag. ${i} de ${pages}`,
      pw - 14, ph - 10, { align: 'right' }
    )
  }
}

// ── Tarjeta de KPI ──
const drawKPICards = (doc, cards, y) => {
  const pw = doc.internal.pageSize.width
  const margin = 14
  const gap = 5
  const cardW = (pw - margin * 2 - gap * (cards.length - 1)) / cards.length

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap)
    const isNeg = card.negative

    doc.setFillColor(...(isNeg ? C.redLight : C.greenLight))
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.gray)
    doc.text(card.label.toUpperCase(), x + cardW / 2, y + 7, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(isNeg ? C.red : C.greenDark))
    doc.text(card.value, x + cardW / 2, y + 16, { align: 'center' })
  })

  return y + 30
}

// Reemplaza checks/cruces unicode por texto ASCII simple para evitar glifos rotos
const cleanText = (str) => String(str).replace(/✓/g, 'OK').replace(/✗/g, 'X')

// ══════════════════════════════════════════════
// REPORTE 1: Resumen General
// ══════════════════════════════════════════════
export const exportResumenGeneral = (data, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })

  let y = drawHeader(doc, 'Resumen General', today, user)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.dark)
  doc.text('Resumen financiero de la finca', 14, y)
  y += 8

  const { summary, cropsSummary = [] } = data

  y = drawKPICards(doc, [
    { label: 'Total invertido',    value: formatCOP(summary?.totalInvested),      negative: false },
    { label: 'Total vendido',      value: formatCOP(summary?.totalIncome),         negative: false },
    { label: 'Ganancia neta',      value: formatCOP(summary?.totalProfit),         negative: (summary?.totalProfit || 0) < 0 },
    { label: 'Gastos del hogar',   value: formatCOP(summary?.householdTotalMonth), negative: false },
  ], y)

  if (cropsSummary.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.dark)
    doc.text('Cultivos activos', 14, y)
    y += 4

    doc.autoTable({
      startY: y,
      head: [['Cultivo', 'Tipo', 'Invertido', 'Vendido', 'Ganancia', 'Estado']],
      body: cropsSummary.map(c => [
        c.name,
        c.type || '—',
        formatCOP(c.totalInvested),
        formatCOP(c.totalSold),
        formatCOP(c.netProfit),
        c.netProfit >= 0 ? 'Ganancia' : 'Perdida',
      ]),
      headStyles: { fillColor: C.green, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.dark },
      alternateRowStyles: { fillColor: C.grayLight },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Ganancia' ? C.green : C.red
        }
      },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.5, lineColor: [229, 231, 235], lineWidth: 0.2 },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  drawFooter(doc)
  doc.save(`AgroFinanzas_Resumen_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ══════════════════════════════════════════════
// REPORTE 2: Cultivo individual
// ══════════════════════════════════════════════
export const exportCropReport = (cropData, expenses, incomes, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { crop, summary } = cropData

  let y = drawHeader(doc, 'Reporte de Cultivo', crop.name, user)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.dark)
  doc.text(crop.name, 14, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${crop.type || '—'} - ${crop.location || '—'} - Estado: ${crop.status}`, 14, y + 6)
  doc.text(`Inicio: ${formatDate(crop.startDate)}   Cosecha est.: ${formatDate(crop.estimatedHarvestDate)}`, 14, y + 12)
  y += 20

  y = drawKPICards(doc, [
    { label: 'Total invertido', value: formatCOP(summary?.totalInvested), negative: false },
    { label: 'Total vendido',   value: formatCOP(summary?.totalSold),     negative: false },
    { label: 'Ganancia neta',   value: formatCOP(summary?.netProfit),     negative: (summary?.netProfit || 0) < 0 },
    { label: 'Rentabilidad',    value: `${summary?.profitability || 0}%`, negative: (summary?.netProfit || 0) < 0 },
  ], y)

  if (expenses.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.dark)
    doc.text(`Gastos del cultivo (${expenses.length} registros)`, 14, y)
    y += 4

    doc.autoTable({
      startY: y,
      head: [['Fecha', 'Categoria', 'Descripcion', 'Valor', 'Pago']],
      body: expenses.map(e => [
        formatDate(e.date), e.category || '—', e.description || '—', formatCOP(e.amount), e.paymentMethod || '—',
      ]),
      headStyles: { fillColor: C.orange, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.dark },
      alternateRowStyles: { fillColor: C.orangeLight },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.5, lineColor: [229, 231, 235], lineWidth: 0.2 },
      foot: [[
        { content: 'TOTAL GASTOS', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: C.orangeLight, textColor: C.dark } },
        { content: formatCOP(expenses.reduce((s, e) => s + e.amount, 0)), styles: { fontStyle: 'bold', halign: 'right', textColor: C.orange, fillColor: C.orangeLight } },
        { content: '', styles: { fillColor: C.orangeLight, textColor: C.dark } },
      ]],
      showFoot: 'lastPage',
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (incomes.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.dark)
    doc.text(`Ingresos del cultivo (${incomes.length} registros)`, 14, y)
    y += 4

    doc.autoTable({
      startY: y,
      head: [['Fecha', 'Tipo', 'Cliente', 'Cantidad', 'Total']],
      body: incomes.map(i => [
        formatDate(i.date), i.type || '—', i.client || '—',
        i.quantitySold > 0 ? `${i.quantitySold} ${i.unit}` : '—',
        formatCOP(i.totalAmount),
      ]),
      headStyles: { fillColor: C.green, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.dark },
      alternateRowStyles: { fillColor: C.greenLight },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.5, lineColor: [229, 231, 235], lineWidth: 0.2 },
      foot: [[
        { content: 'TOTAL INGRESOS', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: C.greenLight, textColor: C.dark } },
        { content: formatCOP(incomes.reduce((s, i) => s + i.totalAmount, 0)), styles: { fontStyle: 'bold', halign: 'right', textColor: C.greenDark, fillColor: C.greenLight } },
      ]],
      showFoot: 'lastPage',
    })
  }

  drawFooter(doc)
  doc.save(`AgroFinanzas_Cultivo_${crop.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ══════════════════════════════════════════════
// REPORTE 3: Gastos del hogar
// ══════════════════════════════════════════════
export const exportHouseholdReport = (items, totalAmount, user, period = '') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = drawHeader(doc, 'Gastos del Hogar', period || new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }), user)

  y = drawKPICards(doc, [
    { label: 'Total gastos del hogar', value: formatCOP(totalAmount), negative: false },
    { label: 'Registros',              value: String(items.length),   negative: false },
  ], y)

  doc.autoTable({
    startY: y,
    head: [['Fecha', 'Categoria', 'Descripcion', 'Valor', 'Pago']],
    body: items.map(e => [
      formatDate(e.date), e.category || '—', e.description || '—', formatCOP(e.amount), e.paymentMethod || '—',
    ]),
    headStyles: { fillColor: C.green, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: C.dark },
    alternateRowStyles: { fillColor: C.grayLight },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5, lineColor: [229, 231, 235], lineWidth: 0.2 },
    foot: [[
      { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: C.greenLight, textColor: C.dark } },
      { content: formatCOP(totalAmount), styles: { fontStyle: 'bold', halign: 'right', textColor: C.greenDark, fillColor: C.greenLight } },
      { content: '', styles: { fillColor: C.greenLight, textColor: C.dark } },
    ]],
    showFoot: 'lastPage',
  })

  drawFooter(doc)
  doc.save(`AgroFinanzas_Hogar_${new Date().toISOString().split('T')[0]}.pdf`)
}