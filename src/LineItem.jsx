import { calcLine, fmt } from './pricing'
import { ROLLER_CATEGORIES } from './rollerGrids'
import styles from './LineItem.module.css'

const TYPES = ['Sheer', 'Drape', 'Roller blind', 'Shutter']
const HEADINGS = ['Wavefold', 'Pinch pleat']
const MATERIALS = ['Basswood', 'PVC']

export default function LineItem({ line, index, config, onChange, onRemove, onDuplicate }) {
  const set = (key, value) => {
    const updated = { ...line, [key]: value }
    if (key === 'type') {
      updated.heading = ''
      updated.fabric = ''
      updated.material = ''
      updated.lining = false
      updated.noHem = false
      updated.rollerCategory = ''
      updated.motorised = false
    }
    onChange(updated)
  }

  const price = calcLine(line, config)
  const needsHeading = line.type === 'Sheer' || line.type === 'Drape'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <input
          className={styles.nameInput}
          type="text"
          placeholder={`Item ${index + 1}`}
          value={line.name}
          onChange={e => set('name', e.target.value)}
        />
        <div className={styles.actions}>
          <button className={styles.dupBtn} onClick={onDuplicate} title="Duplicate">⧉</button>
          <button className={styles.removeBtn} onClick={onRemove}>Remove</button>
        </div>
      </div>

      <div className={styles.label}>Product type</div>
      <div className={`${styles.optGroup} ${styles.cols4}`}>
        {TYPES.map(t => (
          <button
            key={t}
            className={`${styles.optBtn} ${line.type === t ? styles.selected : ''}`}
            onClick={() => set('type', t)}
          >{t}</button>
        ))}
      </div>

      {needsHeading && (
        <>
          <div className={styles.label}>Heading style</div>
          <div className={`${styles.optGroup} ${styles.cols2}`}>
            {HEADINGS.map(h => (
              <button
                key={h}
                className={`${styles.optBtn} ${line.heading === h ? styles.selected : ''}`}
                onClick={() => set('heading', h)}
              >{h}</button>
            ))}
          </div>

          <div className={styles.label}>Fabric category</div>
          <div className={`${styles.optGroup} ${styles.cols4}`}>
            {config.fabrics.map(f => (
              <button
                key={f.name}
                className={`${styles.optBtn} ${line.fabric === f.name ? styles.selected : ''}`}
                onClick={() => set('fabric', f.name)}
              >{f.name}</button>
            ))}
          </div>

          <div className={styles.checkRow}>
            <input
              type="checkbox"
              id={`lining-${line.id}`}
              checked={line.lining}
              onChange={e => set('lining', e.target.checked)}
            />
            <label htmlFor={`lining-${line.id}`}>Add lining</label>
          </div>
          <div className={styles.checkRow}>
            <input
              type="checkbox"
              id={`nohem-${line.id}`}
              checked={!!line.noHem}
              onChange={e => set('noHem', e.target.checked)}
            />
            <label htmlFor={`nohem-${line.id}`}>Remove bottom hem (−${config.hemReduction || 0}/lm)</label>
          </div>
        </>
      )}

      {line.type === 'Roller blind' && (
        <>
          <div className={styles.label}>Fabric category</div>
          <div className={`${styles.optGroup} ${styles.cols4}`}>
            {ROLLER_CATEGORIES.map(c => (
              <button
                key={c}
                className={`${styles.optBtn} ${line.rollerCategory === c ? styles.selected : ''}`}
                onClick={() => set('rollerCategory', c)}
              >{c}</button>
            ))}
          </div>
          <div className={styles.checkRow}>
            <input
              type="checkbox"
              id={`motor-${line.id}`}
              checked={!!line.motorised}
              onChange={e => set('motorised', e.target.checked)}
            />
            <label htmlFor={`motor-${line.id}`}>Add motorisation (+${config.motorisation || 200})</label>
          </div>
        </>
      )}

      {line.type === 'Shutter' && (
        <>
          <div className={styles.label}>Material</div>
          <div className={`${styles.optGroup} ${styles.cols2}`}>
            {MATERIALS.map(m => (
              <button
                key={m}
                className={`${styles.optBtn} ${line.material === m ? styles.selected : ''}`}
                onClick={() => set('material', m)}
              >{m}</button>
            ))}
          </div>
        </>
      )}

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
