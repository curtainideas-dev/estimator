import { useState } from 'react'
import { ROLLER_WIDTHS, ROLLER_DROPS, ROLLER_CATEGORIES } from './rollerGrids'
import styles from './RollerGridEditor.module.css'

export default function RollerGridEditor({ grids, onChange }) {
  const [activeCategory, setActiveCategory] = useState(ROLLER_CATEGORIES[0])

  function updateCell(rowIdx, colIdx, value) {
    const next = JSON.parse(JSON.stringify(grids))
    next[activeCategory][rowIdx][colIdx] = parseInt(value) || 0
    onChange(next)
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
      <p className={styles.hint}>Width and drop in mm. Prices inc. GST. Changes save with the rest of admin settings.</p>
    </div>
  )
}
