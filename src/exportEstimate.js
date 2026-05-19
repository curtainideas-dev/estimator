import * as XLSX from 'xlsx'

export function exportEstimate(lines, prices, config) {
  const wb = XLSX.utils.book_new()

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

  // Build rows
  const headerRow = [
    'Item', 'Product type', 'Heading', 'Fabric category', 'Lining',
    'No bottom hem', 'Material', 'Roller category', 'Motorised',
    'Width (mm)', 'Drop (mm)', 'Low estimate ($)', 'High estimate ($)'
  ]

  const dataRows = lines.map((line, i) => {
    const price = prices[i]
    return [
      line.name || `Item ${i + 1}`,
      line.type || '',
      line.heading || '',
      line.fabric || '',
      line.lining ? 'Yes' : '',
      line.noHem ? 'Yes' : '',
      line.material || '',
      line.rollerCategory || '',
      line.motorised ? 'Yes' : '',
      line.width ? parseInt(line.width) : '',
      line.drop ? parseInt(line.drop) : '',
      price ? Math.ceil(price.low / 500) * 500 : '',
      price ? Math.ceil(price.high / 500) * 500 : '',
    ]
  })

  // Totals
  const validPrices = prices.filter(Boolean)
  const totalLow = validPrices.reduce((s, p) => s + p.low, 0)
  const totalHigh = validPrices.reduce((s, p) => s + p.high, 0)
  const totalInstallLow = validPrices.reduce((s, p) => s + (p.install || 0), 0)
  const totalInstallHigh = validPrices.reduce((s, p) => s + (p.installHigh || 0), 0)

  const blankRow = ['', '', '', '', '', '', '', '', '', '', '', '', '']
  const summaryLabelCol = 10 // column K (0-indexed)

  const totalRow = ['', '', '', '', '', '', '', '', '', '', 'TOTAL ESTIMATE', Math.ceil(totalLow / 500) * 500, Math.ceil(totalHigh / 500) * 500]
  const installRow = ['', '', '', '', '', '', '', '', '', '', 'incl. installation', Math.ceil(totalInstallLow / 500) * 500, Math.ceil(totalInstallHigh / 500) * 500]
  const bufferRow = ['', '', '', '', '', '', '', '', '', '', `Buffer applied`, `±${Math.round(config.buffer / 2)}%`, '']
  const dateRow = ['', '', '', '', '', '', '', '', '', '', 'Generated', `${dateStr} ${timeStr}`, '']

  const wsData = [headerRow, ...dataRows, blankRow, totalRow, installRow, bufferRow, dateRow]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = [
    { wch: 18 }, // Item
    { wch: 14 }, // Product type
    { wch: 14 }, // Heading
    { wch: 16 }, // Fabric
    { wch: 8 },  // Lining
    { wch: 14 }, // No hem
    { wch: 12 }, // Material
    { wch: 14 }, // Roller cat
    { wch: 10 }, // Motorised
    { wch: 12 }, // Width
    { wch: 12 }, // Drop
    { wch: 18 }, // Low
    { wch: 18 }, // High
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Estimate')
  XLSX.writeFile(wb, `Estimate-${dateStr.replace(/\//g, '-')}.xlsx`)
}
