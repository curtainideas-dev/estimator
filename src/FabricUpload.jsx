import { useState } from 'react'
import styles from './FabricUpload.module.css'

const SUPABASE_URL = 'https://lozusjufiisbokjnadhy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3lWZlhxMwQ4vsgGnbSnVzg_tHqlzEnq'
const BATCH_SIZE = 500

function getCategory(price) {
  const p = parseFloat(price)
  if (p < 25) return 'Standard'
  if (p < 50) return 'Plus'
  if (p < 75) return 'Premium'
  return 'Luxury'
}

async function deleteFabrics() {
  await fetch(`${SUPABASE_URL}/rest/v1/fabrics?id=gt.0`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    }
  })
}

async function insertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fabrics`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(rows)
  })
  if (!res.ok) throw new Error(await res.text())
}

export default function FabricUpload({ onClose, onDone }) {
  const [status, setStatus] = useState('idle') // idle | parsing | importing | done | error
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    setStatus('parsing')
    setProgress(0)

    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]

      const rows = []
      for (const r of XLSX.utils.sheet_to_json(ws, { defval: null })) {
        const supplier = r['SupplierName']
        const name = r['FabricName']
        const width = r['FabricWidth']
        const price = r['SellPerMeterincGST']
        if (!supplier || !name || price === null || price === undefined) continue
        const p = parseFloat(price)
        if (isNaN(p)) continue
        rows.push({
          supplier_name: String(supplier).trim(),
          fabric_name: String(name).trim(),
          fabric_width: width ? parseInt(width) : null,
          sell_price: Math.round(p * 100) / 100,
          category: getCategory(p)
        })
      }

      setTotal(rows.length)
      setStatus('importing')

      await deleteFabrics()

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await insertBatch(rows.slice(i, i + BATCH_SIZE))
        setProgress(Math.min(i + BATCH_SIZE, rows.length))
      }

      setStatus('done')
      setTimeout(() => { onDone(); onClose() }, 1500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Unknown error')
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Update fabric catalogue</span>
          <button className={styles.closeBtn} onClick={onClose} disabled={status === 'importing'}>✕</button>
        </div>

        {status === 'idle' && (
          <>
            <p className={styles.desc}>Upload a new fabric spreadsheet to replace the current catalogue. The file must have four columns: <strong>SupplierName, FabricName, FabricWidth, SellPerMeterincGST</strong>. Category is calculated automatically from the sell price.</p>
            <label className={styles.fileLabel}>
              <input type="file" accept=".xlsx" onChange={handleFile} className={styles.fileInput} />
              Choose .xlsx file
            </label>
          </>
        )}

        {status === 'parsing' && (
          <div className={styles.statusBox}>
            <div className={styles.spinner} />
            <p>Reading spreadsheet…</p>
          </div>
        )}

        {status === 'importing' && (
          <div className={styles.statusBox}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(progress / total) * 100}%` }} />
            </div>
            <p>{progress.toLocaleString()} / {total.toLocaleString()} fabrics imported</p>
          </div>
        )}

        {status === 'done' && (
          <div className={styles.statusBox}>
            <div className={styles.successIcon}>✓</div>
            <p>{total.toLocaleString()} fabrics imported successfully</p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.statusBox}>
            <p className={styles.errorText}>Import failed: {errorMsg}</p>
            <button className={styles.retryBtn} onClick={() => setStatus('idle')}>Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}
