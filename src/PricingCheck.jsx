import { useState } from 'react'
import { calcLineBreakdown, fmt } from './pricing'
import { ROLLER_CATEGORIES } from './rollerGrids'
import styles from './PricingCheck.module.css'

const TYPES = ['Sheer', 'Drape', 'Roller blind', 'Shutter']
const HEADINGS = ['Wavefold', 'Pinch pleat']
const MATERIALS = ['Basswood', 'PVC']

function emptyLine() {
  return { type: '', heading: '', fabric: '', lining: false, noHem: false, material: '', rollerCategory: '', motorised: false, width: '', drop: '' }
}

export default function PricingCheck({ config }) {
  const [line, setLine] = useState(emptyLine())

  const set = (key, value) => {
    setLine(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'type') {
        updated.heading = ''
        updated.fabric = ''
        updated.material = ''
        updated.lining = false
        updated.noHem = false
        updated.rollerCategory = ''
        updated.motorised = false
      }
      return updated
    })
  }

  const breakdown = calcLineBreakdown(line, config)
  const needsHeading = line.type === 'Sheer' || line.type === 'Drape'

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Pricing breakdown</div>
        <p className={styles.hint}>Configure a product to see exactly how the price is calculated.</p>

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
                >
                  {f.name}
                  <span className={styles.optSub}>${f.min}–${f.max}/m</span>
                </button>
              ))}
            </div>

            <div className={styles.checkRow}>
              <input
                type="checkbox"
                id="pc-lining"
                checked={line.lining}
                onChange={e => set('lining', e.target.checked)}
              />
              <label htmlFor="pc-lining">Add lining (+${config.lining}/m)</label>
            </div>
            <div className={styles.checkRow}>
              <input
                type="checkbox"
                id="pc-nohem"
                checked={!!line.noHem}
                onChange={e => set('noHem', e.target.checked)}
              />
              <label htmlFor="pc-nohem">Remove bottom hem (−${config.hemReduction || 0}/lm)</label>
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
                id="pc-motor"
                checked={!!line.motorised}
                onChange={e => set('motorised', e.target.checked)}
              />
              <label htmlFor="pc-motor">Add motorisation (+${config.motorisation || 200})</label>
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
                >
                  {m}
                  <span className={styles.optSub}>
                    ${m === 'Basswood' ? config.shutterBass : config.shutterPvc}/m²
                  </span>
                </button>
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
      </div>

      {breakdown && (
        <div className={styles.breakdownCard}>
          <div className={styles.cardTitle}>Cost breakdown</div>

          <table className={styles.table}>
            <tbody>
              {breakdown.components.map((c, i) => (
                <tr key={i}>
                  <td className={styles.compLabel}>{c.label}</td>
                  <td className={styles.compValue}>${fmt(c.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td>Base price</td>
                <td>${fmt(breakdown.base)}</td>
              </tr>
              <tr className={styles.bufferRow}>
                <td>After ±{Math.round(config.buffer / 2)}% buffer</td>
                <td>${fmt(breakdown.low)} – ${fmt(breakdown.high)}</td>
              </tr>
            </tfoot>
          </table>

          <div className={styles.resetRow}>
            <button className={styles.resetBtn} onClick={() => setLine(emptyLine())}>Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}
