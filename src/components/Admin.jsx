import { useState } from 'react'
import { supabase, CONFIG_ID } from '../supabase'
import styles from './Admin.module.css'

export default function Admin({ config, setConfig }) {
  const [status, setStatus] = useState('saved') // 'saved' | 'dirty' | 'saving'
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(config)))

  function update(path, value) {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
    setStatus('dirty')
  }

  function updateFabric(i, key, value) {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.fabrics[i][key] = key === 'name' ? value : parseFloat(value) || 0
      return next
    })
    setStatus('dirty')
  }

  async function save() {
    setStatus('saving')
    const { error } = await supabase
      .from('quote_config')
      .upsert({ id: CONFIG_ID, config: local })
    if (!error) {
      setConfig(local)
      setStatus('saved')
    } else {
      setStatus('dirty')
      alert('Save failed: ' + error.message)
    }
  }

  const n = (path) => {
    const keys = path.split('.')
    let obj = local
    for (const k of keys) obj = obj[k]
    return obj
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <section className={styles.section}>
          <h3>Fabric categories</h3>
          <div className={styles.fabricHeader}>
            <span>Name</span><span>Min $/m</span><span>Max $/m</span>
          </div>
          {local.fabrics.map((f, i) => (
            <div key={i} className={styles.fabricRow}>
              <input type="text" value={f.name} onChange={e => updateFabric(i, 'name', e.target.value)} />
              <input type="number" value={f.min} onChange={e => updateFabric(i, 'min', e.target.value)} />
              <input type="number" value={f.max} onChange={e => updateFabric(i, 'max', e.target.value)} />
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h3>Make &amp; lining</h3>
          <AdminRow label="Make cost ($/m of fabric)" value={local.make} onChange={v => update('make', v)} />
          <AdminRow label="Lining cost ($/m of fabric)" value={local.lining} onChange={v => update('lining', v)} />
        </section>

        <section className={styles.section}>
          <h3>Installation (per drop / unit)</h3>
          <AdminRow label="Sheer" value={local.install.sheer} onChange={v => update('install.sheer', v)} />
          <AdminRow label="Drape" value={local.install.drape} onChange={v => update('install.drape', v)} />
          <AdminRow label="Shutter" value={local.install.shutter} onChange={v => update('install.shutter', v)} />
          <AdminRow label="Roller blind" value={local.install.roller} onChange={v => update('install.roller', v)} />
        </section>

        <section className={styles.section}>
          <h3>Track pricing</h3>
          <div className={styles.subLabel}>Wavefold</div>
          <AdminRow label="Fixed ($)" value={local.wavefold.fixed} onChange={v => update('wavefold.fixed', v)} />
          <AdminRow label="Per mm ($/mm)" value={local.wavefold.perMm} step="0.000001" onChange={v => update('wavefold.perMm', v)} />
          <AdminRow label="Min width (mm)" value={local.wavefold.min} onChange={v => update('wavefold.min', v)} />
          <div className={styles.subLabel}>Pinch pleat</div>
          <AdminRow label="Fixed ($)" value={local.pinch.fixed} onChange={v => update('pinch.fixed', v)} />
          <AdminRow label="Per mm ($/mm)" value={local.pinch.perMm} step="0.000001" onChange={v => update('pinch.perMm', v)} />
          <AdminRow label="Min width (mm)" value={local.pinch.min} onChange={v => update('pinch.min', v)} />
        </section>

        <section className={styles.section}>
          <h3>Roller blinds</h3>
          <AdminRow label="Price per m² ($)" value={local.rollerSqm} onChange={v => update('rollerSqm', v)} />
          <p className={styles.hint}>Grid pricing upload coming soon</p>
        </section>

        <section className={styles.section}>
          <h3>Shutters (per m²)</h3>
          <AdminRow label="Basswood ($/m²)" value={local.shutterBass} onChange={v => update('shutterBass', v)} />
          <AdminRow label="PVC ($/m²)" value={local.shutterPvc} onChange={v => update('shutterPvc', v)} />
        </section>

        <section className={styles.section}>
          <h3>Quote buffer</h3>
          <AdminRow label="Buffer (%)" value={local.buffer} onChange={v => update('buffer', v)} />
          <p className={styles.hint}>The estimate shows ±half this value around the calculated price</p>
        </section>

      </div>

      <div className={styles.saveBar}>
        <span className={`${styles.saveStatus} ${status === 'saved' ? styles.saved : ''}`}>
          {status === 'saved' ? 'All changes saved' : status === 'saving' ? 'Saving...' : 'Unsaved changes'}
        </span>
        <button
          className={styles.saveBtn}
          onClick={save}
          disabled={status === 'saved' || status === 'saving'}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

function AdminRow({ label, value, onChange, step = '0.01' }) {
  return (
    <div className={styles.adminRow}>
      <label>{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  )
}
