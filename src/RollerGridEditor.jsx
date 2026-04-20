import { useState } from 'react'
import { ROLLER_WIDTHS, ROLLER_DROPS, ROLLER_CATEGORIES } from './rollerGrids'
import styles from './RollerGridEditor.module.css'

function parseExcelText(text) {
  const rows = text.trim().split('\n').map(r => r.split('\t'))
  const firstCell = rows[0][0].trim()
  const hasHeaderRow = isNaN(parseInt(firstCell))
  const dataRows = hasHeaderRow ? rows.slice(1) : rows
  const hasHeaderCol = dataRows.length > 0 && isNaN(parseInt(dataRows[0][0].trim()))
  return hasHeaderCol ? dataRows.map(r => r.slice(1)) : dataRows
}

export default function RollerGridEditor({ grids, onChange }) {
  const [activeCategory, setActiveCategory] = useState(ROLLER_CATEGORIES[0])
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteStatus, setPasteStatus] = useState(null)
  const [pasteMsg, setPasteMsg] = useState('')

  function updateCell(rowIdx, colIdx, value) {
    const next = JSON.parse(JSON.stringify(grids))
    next[activeCategory][rowIdx][colIdx] = parseInt(value) || 0
    onChange(next)
  }

  function handleApplyPaste() {
    if (!pasteText.trim()) {
      setPasteStatus('error')
      setPasteMsg('Paste your Excel table into the box first')
      return
    }
    const dataCols = parseExcelText(pasteText)
    if (dataCols.length !== ROLLER_DROPS.length || dataCols[0].length !== ROLLER_WIDTHS.length) {
      setPasteStatus('error')
      setPasteMsg(`Expected ${ROLLER_DROPS.length} rows × ${ROLLER_WIDTHS.length} cols, got ${dataCols.length} × ${dataCols[0]?.length ?? 0}. Include or exclude headers — both work.`)
      return
    }
    const newGrid = dataCols.map(row =>
      row.map(cell => parseInt(cell.trim().replace(/[^0-9]/g, '')) || 0)
    )
    const next = JSON.parse(JSON.stringify(grids))
    next[activeCategory] = newGrid
    onChange(next)
    setPasteStatus('success')
    setPasteMsg(`${activeCategory} updated — hit Save changes to persist`)
    setPasteText('')
    setShowPasteBox(false)
    setTimeout(() => setPasteStatus(null), 4000)
  }

  function handleCancel() {
    setShowPasteBox(false)
    setPasteText('')
    setPasteStatus(null)
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
        {!showPasteBox ? (
          <button className={styles.pasteBtn} onClick={() => { setShowPasteBox(true); setPasteStatus(null) }}>
            ⊕ Paste from Excel
          </button>
        ) : (
          <div className={styles.pasteBox}>
            <p className={styles.pasteInstructions}>
              Copy your table in Excel (<strong>Ctrl+C</strong>), click in the box below, then paste (<strong>Ctrl+V</strong>). Headers optional.
            </p>
            <textarea
              className={styles.pasteArea}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste Excel data here…"
              rows={5}
              autoFocus
            />
            <div className={styles.pasteActions}>
              <button className={styles.applyBtn} onClick={handleApplyPaste}>Apply</button>
              <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        )}
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
      <p className={styles.hint}>Prices inc. GST. Hit Save changes after updating.</p>
    </div>
  )
}
