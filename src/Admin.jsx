import { useState } from 'react'
import { saveConfig } from './supabase'
import RollerGridEditor from './RollerGridEditor'
import styles from './Admin.module.css'

export default function Admin({ config, onSave }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(config)))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(path, value) {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
    setDirty(true)
    setSaved(false)
  }

  function updateFabric(i, key, value) {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.fabrics[i][key] = key === 'name' ? value : parseFloat(value) || 0
      return next
    })
    setDirty(true)
    setSaved(false)
  }

  function updateRollerGrids(grids) {
    setLocal(prev => ({ ...prev, rollerGrids: grids }))
    setDirty(true)
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveConfig(local)
      onSave(local)
      setDirty(false)
      setSaved(true)
    } catch {
      alert('Save failed — check Supabase setup')
    } finally {
      setSaving(false)
    }
  }

  const n = (path) => parseFloat(path.split('.').reduce((o, k) => o[k], local)) || 0

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
          <h3>Fabric settings</h3>
          <Row label="Fullness ratio" value={local.fullness} step="0.1" onChange={v => update('fullness', v)} />
          <Row label="Max fabric width (mm)" value={local.maxFabricWidth} step="1" onChange={v => update('maxFabricWidth', v)} />
        </section>

        <section className={styles.section}>
          <h3>Make &amp; lining</h3>
          <Row label="Make cost ($/m of fabric)" value={local.make} onChange={v => update('make', v)} />
          <Row label="Lining cost ($/m of fabric)" value={local.lining} onChange={v => update('lining', v)} />
        </section>

        <section className={styles.section}>
          <h3>Installation (per drop / unit)</h3>
          <Row label="Sheer" value={local.install.sheer} onChange={v => update('install.sheer', v)} />
          <Row label="Drape" value={local.install.drape} onChange={v => update('install.drape', v)} />
          <Row label="Shutter" value={local.install.shutter} onChange={v => update('install.shutter', v)} />
          <Row label="Roller blind" value={local.install.roller} onChange={v => update('install.roller', v)} />
        </section>

        <section className={styles.section}>
          <h3>Track pricing</h3>
          <div className={styles.subLabel}>Wavefold</div>
          <Row label="Fixed ($)" value={local.wavefold.fixed} onChange={v => update('wavefold.fixed', v)} />
          <Row label="Per mm ($/mm)" value={local.wavefold.perMm} step="0.000001" onChange={v => update('wavefold.perMm', v)} />
          <Row label="Min width (mm)" value={local.wavefold.min} onChange={v => update('wavefold.min', v)} />
          <div className={styles.subLabel}>Pinch pleat</div>
          <Row label="Fixed ($)" value={local.pinch.fixed} onChange={v => update('pinch.fixed', v)} />
          <Row label="Per mm ($/mm)" value={local.pinch.perMm} step="0.000001" onChange={v => update('pinch.perMm', v)} />
          <Row label="Min width (mm)" value={local.pinch.min} onChange={v => update('pinch.min', v)} />
        </section>

        <section className={styles.section}>
          <h3>Roller blinds</h3>
          <Row label="Motorisation (flat add-on $)" value={local.motorisation ?? 200} step="1" onChange={v => update('motorisation', v)} />
          <div className={styles.subLabel} style={{marginTop: '16px'}}>Pricing grids</div>
          {local.rollerGrids && (
            <RollerGridEditor
              grids={local.rollerGrids}
              onChange={updateRollerGrids}
            />
          )}
        </section>

        <section className={styles.section}>
          <h3>Shutters (per m²)</h3>
          <Row label="Basswood ($/m²)" value={local.shutterBass} onChange={v => update('shutterBass', v)} />
          <Row label="PVC ($/m²)" value={local.shutterPvc} onChange={v => update('shutterPvc', v)} />
        </section>

        <section className={styles.section}>
          <h3>Quote range buffer</h3>
          <Row label="Buffer (%)" value={local.buffer} onChange={v => update('buffer', v)} />
          <p className={styles.hint}>Estimate shows ±half this value around the calculated price</p>
        </section>

      </div>

      <div className={styles.saveBar}>
        <span className={saved ? styles.savedText : styles.statusText}>
          {saved ? 'All changes saved' : dirty ? 'Unsaved changes' : ''}
        </span>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, onChange, step = '0.01' }) {
  return (
    <div className={styles.row}>
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
