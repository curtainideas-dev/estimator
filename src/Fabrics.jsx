import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { insertFabric, updateFabric, deleteFabric, getCategory } from './fabricMeta'
import styles from './Fabrics.module.css'

const SUPABASE_URL = 'https://lozusjufiisbokjnadhy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3lWZlhxMwQ4vsgGnbSnVzg_tHqlzEnq'
const PAGE_SIZE = 50
const CATEGORIES = ['All', 'Standard', 'Plus', 'Premium', 'Luxury']

const CATEGORY_COLOURS = {
  Standard: { bg: '#e8f0fd', text: '#1a3d6b', border: '#4a7dd9' },
  Plus:     { bg: '#e8f5e9', text: '#1a5c2a', border: '#4caf50' },
  Premium:  { bg: '#fdf8e1', text: '#6b5a1a', border: '#f5c842' },
  Luxury:   { bg: '#fdecea', text: '#6b1a1a', border: '#e53935' },
}

async function queryFabrics({ search, category, page }) {
  let url = `${SUPABASE_URL}/rest/v1/fabrics?select=id,supplier_name,fabric_name,fabric_width,sell_price,category`
  const filters = []
  if (category && category !== 'All') filters.push(`category=eq.${encodeURIComponent(category)}`)
  if (search?.trim()) {
    const s = search.trim()
    filters.push(`or=(fabric_name.ilike.*${encodeURIComponent(s)}*,supplier_name.ilike.*${encodeURIComponent(s)}*)`)
  }
  if (filters.length) url += '&' + filters.join('&')
  url += `&order=fabric_name.asc&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
  const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' } })
  const total = parseInt(res.headers.get('content-range')?.split('/')[1] || '0')
  return { data: await res.json(), total }
}

async function queryAllFabrics() {
  let all = [], page = 0
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/fabrics?select=supplier_name,fabric_name,fabric_width,sell_price,category&order=fabric_name.asc&limit=1000&offset=${page * 1000}`
    const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } })
    const data = await res.json()
    all = [...all, ...data]
    if (data.length < 1000) break
    page++
  }
  return all
}

async function fetchSuppliers() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_distinct_suppliers`,
    { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' }
  )
  const data = await res.json()
  // Returns array of strings when using setof text
  return Array.isArray(data) ? data.filter(Boolean).sort() : []
}

function emptyForm() {
  return { supplier_name: '', fabric_name: '', fabric_width: '', sell_price: '' }
}

export default function Fabrics({ isAdmin, onUpload }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const debounceRef = useRef(null)

  const load = useCallback(async (s, cat, p) => {
    setLoading(true)
    setError(null)
    try {
      const { data, total } = await queryFabrics({ search: s, category: cat, page: p })
      setRows(data)
      setTotal(total)
    } catch (e) {
      setError('Could not load fabrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); load(search, category, 0) }, 300)
  }, [search, category])

  useEffect(() => { load(search, category, page) }, [page])

  function openAdd() {
    setForm(emptyForm()); setEditRow(null); setFormError(''); setShowAdd(true)
    fetchSuppliers().then(setSuppliers)
  }
  function openEdit(row) {
    setForm({ supplier_name: row.supplier_name, fabric_name: row.fabric_name, fabric_width: row.fabric_width || '', sell_price: row.sell_price })
    setEditRow(row); setFormError(''); setShowAdd(true)
    fetchSuppliers().then(setSuppliers)
  }
  function closeForm() { setShowAdd(false); setEditRow(null) }

  async function handleSave() {
    if (!form.supplier_name.trim() || !form.fabric_name.trim() || !form.sell_price) {
      setFormError('Supplier name, fabric name and sell price are required')
      return
    }
    const p = parseFloat(form.sell_price)
    if (isNaN(p) || p <= 0) { setFormError('Enter a valid sell price'); return }
    setSaving(true)
    setFormError('')
    try {
      const row = {
        supplier_name: form.supplier_name.trim(),
        fabric_name: form.fabric_name.trim(),
        fabric_width: form.fabric_width ? parseInt(form.fabric_width) : null,
        sell_price: Math.round(p * 100) / 100,
        category: getCategory(p)
      }
      if (editRow) {
        await updateFabric(editRow.id, row)
      } else {
        await insertFabric(row)
      }
      closeForm()
      load(search, category, page)
    } catch (e) {
      setFormError('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Delete "${row.fabric_name}" by ${row.supplier_name}?`)) return
    try {
      await deleteFabric(row.id)
      load(search, category, page)
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const all = await queryAllFabrics()
      const ws = XLSX.utils.json_to_sheet(all.map(r => ({
        SupplierName: r.supplier_name,
        FabricName: r.fabric_name,
        FabricWidth: r.fabric_width,
        SellPerMeterincGST: r.sell_price,
        Category: r.category
      })))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Fabrics')
      const date = new Date().toLocaleDateString('en-AU').replace(/\//g, '-')
      XLSX.writeFile(wb, `FabricCatalogue-${date}.xlsx`)
    } catch (e) {
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input className={styles.search} type="text" placeholder="Search fabric name or supplier…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.catFilters}>
          {CATEGORIES.map(c => (
            <button key={c} className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`} onClick={() => { setCategory(c); setPage(0) }}>{c}</button>
          ))}
        </div>
        <div className={styles.adminBtns}>
          <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting…' : '↓ Export'}</button>
          {isAdmin && (
            <>
              <button className={styles.addBtn} onClick={openAdd}>+ Add fabric</button>
              <button className={styles.uploadBtn} onClick={onUpload}>↑ Import</button>
            </>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        {!loading && <span>{total.toLocaleString()} fabrics{search ? ` matching "${search}"` : ''}</span>}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>No fabrics found</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fabric name</th>
                  <th>Supplier</th>
                  <th>Width</th>
                  <th>Sell price</th>
                  <th>Category</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const colours = CATEGORY_COLOURS[row.category] || {}
                  return (
                    <tr key={row.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.nameCell}>{row.fabric_name}</td>
                      <td className={styles.supplierCell}>{row.supplier_name}</td>
                      <td className={styles.widthCell}>{row.fabric_width ? `${row.fabric_width}mm` : '—'}</td>
                      <td className={styles.priceCell}>${row.sell_price?.toFixed(2)}/m</td>
                      <td><span className={styles.catTag} style={{ background: colours.bg, color: colours.text, borderColor: colours.border }}>{row.category}</span></td>
                      {isAdmin && (
                        <td className={styles.actionCell}>
                          <button className={styles.editBtn} onClick={() => openEdit(row)}>Edit</button>
                          <button className={styles.deleteBtn} onClick={() => handleDelete(row)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
              <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{editRow ? 'Edit fabric' : 'Add fabric'}</span>
              <button className={styles.closeBtn} onClick={closeForm}>✕</button>
            </div>
            <div className={styles.formField}>
              <label>Supplier name *</label>
              <select
                value={form.supplier_name}
                onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                className={styles.select}
              >
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Fabric name *</label>
              <input type="text" value={form.fabric_name} onChange={e => setForm(f => ({ ...f, fabric_name: e.target.value }))} placeholder="e.g. ABBY" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Width (mm)</label>
                <input type="number" value={form.fabric_width} onChange={e => setForm(f => ({ ...f, fabric_width: e.target.value }))} placeholder="e.g. 137" />
              </div>
              <div className={styles.formField}>
                <label>Sell price ($/m) *</label>
                <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="e.g. 43.12" />
              </div>
            </div>
            {form.sell_price && !isNaN(parseFloat(form.sell_price)) && (
              <div className={styles.categoryPreview}>
                Category: <span style={{ color: CATEGORY_COLOURS[getCategory(form.sell_price)]?.text, fontWeight: 600 }}>{getCategory(form.sell_price)}</span>
              </div>
            )}
            {formError && <div className={styles.formError}>{formError}</div>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeForm}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editRow ? 'Save changes' : 'Add fabric'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}