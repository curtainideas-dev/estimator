import { useState } from 'react'
import { ROLLER_WIDTHS, ROLLER_DROPS, ROLLER_CATEGORIES } from './rollerGrids'
import styles from './RollerGridEditor.module.css'

export default function RollerGridEditor({ grids, onChange }) {
  const [activeCategory, setActiveCategory] = useState(ROLLER_CATEGORIES[0])
  const [pasteStatus, setPasteStatus] = useState(null) // null | 'success' | 'error'
  const [pasteMsg, setPasteMsg] = useState('')

  function updateCell(rowIdx, colIdx, value) {
    const next = JSON.parse(JSON.stringify(grids))
    next[activeCategory][rowIdx][colIdx] = parseInt(value) || 0
    onChange(next)
  }

  async function handlePaste() {
    setPasteStatus(null)
    try {
      const text = await navigator.clipboard.readText()
      const rows = text.trim().split('\n').map(r => r.split('\t'))

      // Auto-detect if first row/col are headers and strip them
      // If top-left cell is non-numeric, treat as header row + header col
      const firstCell = rows[0][0].trim()
      const hasHeaderRow = isNaN(parseInt(firstCell))
      const dataRows = hasHeaderRow ? rows.slice(1) : rows
      const hasHeaderCol = dataRows.length > 0 && isNaN(parseInt(dataRows[0][0].trim()))
      const dataCols = hasHeaderCol ? dataRows.map(r => r.slice(1)) : dataRows

      if (dataCols.length === 0 || dataCols[0].length === 0) {
        setPasteStatus('error')
        setPasteMsg('Nothing to paste — copy your table from Excel first')
        return
      }

      if (dataCols.length !== ROLLER_DROPS.length || dataCols[0].length !== ROLLER_WIDTHS.length) {
        setPasteStatus('error')
        setPasteMsg(`Expected ${ROLLER_DROPS.length} rows × ${ROLLER_WIDTHS.length} cols of data, got ${dataCols.length} × ${dataCols[0].length}. Make sure you copy only the price cells (not the headers) or include the full table with headers.`)
        return
      }

      const newGrid = dataCols.map(row =>
        row.map(cell => parseInt(cell.trim().replace(/[^0-9]/g, '')) || 0)
      )

      const next = JSON.parse(JSON.stringify(grids))
      next[activeCategory] = newGrid
      onChange(next)
      setPasteStatus('success')
      setPasteMsg(`${activeCategory} grid updated from clipboard`)
      setTimeout(() => setPasteStatus(null), 3000)
    } catch (e) {
      setPasteStatus('error')
      setPasteMsg('Could not read clipboard — make sure you\'ve copied your Excel table first')
    }
  }

  const grid = grids[activeCategory] || []

  return (
    <div className={styles.container}>
      <div className={styles.categoryTabs}>
        {ROLLER_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.catTab} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.pasteRow}>
        <button className={styles.pasteBtn} onClick={handlePaste}>
          ⊕ Paste from Excel
        </button>
        {pasteStatus && (
          <span className={pasteStatus === 'success' ? styles.pasteSuccess : styles.pasteError}>
            {pasteMsg}
          </span>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th className={styles.cornerCell}>Drop \ Width</th>
              {ROLLER_WIDTHS.map(w => (
                <th key={w} className={styles.headerCell}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLLER_DROPS.map((drop, rowIdx) => (
              <tr key={drop}>
                <td className={styles.rowHeader}>{drop}</td>
                {ROLLER_WIDTHS.map((_, colIdx) => (
                  <td key={colIdx} className={styles.cell}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={grid[rowIdx]?.[colIdx] ?? ''}
                      onChange={e => updateCell(rowIdx, colIdx, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        To bulk update: select and copy the table in Excel (with or without headers), select the category above, then click "Paste from Excel". Hit Save changes when done.
      </p>
    </div>
  )
}
