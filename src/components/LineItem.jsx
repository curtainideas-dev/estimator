import { calcLine, fmt } from '../calc'
import styles from './LineItem.module.css'

const TYPES = ['Sheer', 'Drape', 'Roller blind', 'Shutter']
const HEADINGS = ['Wavefold', 'Pinch pleat']
const MATERIALS = ['Basswood', 'PVC']

export default function LineItem({ line, index, config, onChange, onRemove }) {
  const set = (k, v) => {
    const updated = { ...line, [k]: v }
    if (k === 'type') { updated.heading = ''; updated.fabric = ''; updated.material = '' }
    onChange(index, updated)
  }

  const price = calcLine(line, config)
  const isCurtain = line.type === 'Sheer' || line.type === 'Drape'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Item {index + 1}</span>
        <button className={styles.removeBtn} onClick={() => onRemove(index)}>Remove</button>
      </div>

      <div className={styles.sectionLabel}>Product type</div>
      <div className={`${styles.optGroup} ${styles.cols4}`}>
        {TYPES.map(t => (
          <button
            key={t}
            className={`${styles.optBtn} ${line.type === t ? styles.selected : ''}`}
            onClick={() => set('type', t)}
          >{t}</button>
        ))}
      </div>

      {isCurtain && <>
        <div className={styles.sectionLabel}>Heading style</div>
        <div className={`${styles.optGroup} ${styles.cols2}`}>
          {HEADINGS.map(h => (
            <button
              key={h}
              className={`${styles.optBtn} ${line.heading === h ? styles.selected : ''}`}
              onClick={() => set('heading', h)}
            >{h}</button>
          ))}
        </div>

        <div className={styles.sectionLabel}>Fabric category</div>
        <div className={`${styles.optGroup} ${styles.cols4}`}>
          {config.fabrics.map(f => (
            <button
              key={f.name}
              className={`${styles.optBtn} ${line.fabric === f.name ? styles.selected : ''}`}
              onClick={() => set('fabric', f.name)}
            >
              {f.name}
              <span className={styles.optSub}>${f.min}–${f.max}/m</span>
            </button>
          ))}
        </div>

        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id={`lining-${index}`}
            checked={line.lining}
            onChange={e => set('lining', e.target.checked)}
          />
          <label htmlFor={`lining-${index}`}>Add lining (+${config.lining}/m)</label>
        </div>
      </>}

      {line.type === 'Shutter' && <>
        <div className={styles.sectionLabel}>Material</div>
        <div className={`${styles.optGroup} ${styles.cols2}`}>
          {MATERIALS.map(m => (
            <button
              key={m}
              className={`${styles.optBtn} ${line.material === m ? styles.selected : ''}`}
              onClick={() => set('material', m)}
            >
              {m}
              <span className={styles.optSub}>${m === 'Basswood' ? config.shutterBass : config.shutterPvc}/m²</span>
            </button>
          ))}
        </div>
      </>}

      {line.type && (
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label>Width (mm)</label>
            <input
              type="number"
              value={line.width}
              placeholder="e.g. 2400"
              onChange={e => set('width', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Drop (mm)</label>
            <input
              type="number"
              value={line.drop}
              placeholder="e.g. 2700"
              onChange={e => set('drop', e.target.value)}
            />
          </div>
        </div>
      )}

      {price && (
        <div className={styles.priceBar}>
          <span className={styles.priceDesc}>{price.desc}</span>
          <span className={styles.priceVal}>${fmt(price.low)} – ${fmt(price.high)}</span>
        </div>
      )}
    </div>
  )
}
