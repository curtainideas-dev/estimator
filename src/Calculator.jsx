import { useState } from 'react'
import LineItem from './LineItem'
import { calcLine, fmt } from './pricing'
import styles from './Calculator.module.css'

let nextId = 1
function emptyLine() {
  return { id: nextId++, name: '', type: '', heading: '', fabric: '', lining: false, material: '', rollerCategory: '', motorised: false, width: '', drop: '' }
}

export default function Calculator({ config }) {
  const [lines, setLines] = useState([emptyLine()])

  function updateLine(id, updated) {
    setLines(prev => prev.map(l => l.id === id ? updated : l))
  }

  function removeLine(id) {
    setLines(prev => prev.length === 1 ? [emptyLine()] : prev.filter(l => l.id !== id))
  }

  function duplicateLine(id) {
    setLines(prev => {
      const idx = prev.findIndex(l => l.id === id)
      const copy = { ...prev[idx], id: nextId++, name: prev[idx].name ? `${prev[idx].name} (copy)` : '' }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()])
  }

  function clearAll() {
    setLines([emptyLine()])
  }

  const prices = lines.map(l => calcLine(l, config)).filter(Boolean)
  const totalLow = prices.reduce((s, p) => s + p.low, 0)
  const totalHigh = prices.reduce((s, p) => s + p.high, 0)
  const hasEstimate = prices.length > 0

  return (
    <div className={styles.container}>
      {lines.map((line, i) => (
        <LineItem
          key={line.id}
          line={line}
          index={i}
          config={config}
          onChange={updated => updateLine(line.id, updated)}
          onRemove={() => removeLine(line.id)}
          onDuplicate={() => duplicateLine(line.id)}
        />
      ))}

      <button className={styles.addBtn} onClick={addLine}>+ Add item</button>

      {hasEstimate && (
        <div className={styles.estimate}>
          <div className={styles.estimateLabel}>Estimated range · inc. GST</div>
          <div className={styles.estimateRange}>${fmt(totalLow)} – ${fmt(totalHigh)}</div>
          <div className={styles.estimateNote}>
            {prices.length} item{prices.length > 1 ? 's' : ''} · ±{Math.round(config.buffer / 2)}% buffer applied
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
      </div>
    </div>
  )
}
