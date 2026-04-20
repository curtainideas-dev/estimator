import { calcLine, fmt } from '../calc'
import LineItem from './LineItem'
import styles from './Calculator.module.css'

function newLine() {
  return { type: '', heading: '', fabric: '', lining: false, material: '', width: '', drop: '' }
}

export default function Calculator({ lines, setLines, config }) {
  function addLine() {
    setLines(prev => [...prev, newLine()])
  }

  function updateLine(index, updated) {
    setLines(prev => prev.map((l, i) => i === index ? updated : l))
  }

  function removeLine(index) {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setLines([newLine()])
  }

  const prices = lines.map(l => calcLine(l, config)).filter(Boolean)
  const total = prices.length > 0 ? {
    low: prices.reduce((s, p) => s + p.low, 0),
    high: prices.reduce((s, p) => s + p.high, 0),
  } : null

  return (
    <div className={styles.container}>
      {lines.map((line, i) => (
        <LineItem
          key={i}
          line={line}
          index={i}
          config={config}
          onChange={updateLine}
          onRemove={removeLine}
        />
      ))}

      <button className={styles.addBtn} onClick={addLine}>+ Add item</button>

      {total && (
        <div className={styles.estimate}>
          <div className={styles.estimateLabel}>Estimated range · inc. GST</div>
          <div className={styles.estimateRange}>${fmt(total.low)} – ${fmt(total.high)}</div>
          <div className={styles.estimateNote}>
            {prices.length} item{prices.length > 1 ? 's' : ''} · ±{Math.round(config.buffer / 2)}% buffer applied
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
      </div>
    </div>
  )
}
