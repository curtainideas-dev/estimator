import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './Fabrics.module.css'

const SUPABASE_URL = 'https://lozusjufiisbokjnadhy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3lWZlhxMwQ4vsgGnbSnVzg_tHqlzEnq'
const PAGE_SIZE = 50
const CATEGORIES = ['All', 'Standard', 'Plus', 'Premium', 'Luxury']

async function queryFabrics({ search, category, page }) {
  let url = `${SUPABASE_URL}/rest/v1/fabrics?select=supplier_name,fabric_name,fabric_width,sell_price,category`

  const filters = []
  if (category && category !== 'All') {
    filters.push(`category=eq.${encodeURIComponent(category)}`)
  }
  if (search && search.trim()) {
    const s = search.trim()
    filters.push(`or=(fabric_name.ilike.*${encodeURIComponent(s)}*,supplier_name.ilike.*${encodeURIComponent(s)}*)`)
  }

  if (filters.length) url += '&' + filters.join('&')
  url += `&order=fabric_name.asc`
  url += `&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact',
    }
  })
  const total = parseInt(res.headers.get('content-range')?.split('/')[1] || '0')
  const data = await res.json()
  return { data, total }
}

const CATEGORY_COLOURS = {
  Standard: { bg: '#e8f0fd', text: '#1a3d6b', border: '#4a7dd9' },
  Plus:     { bg: '#e8f5e9', text: '#1a5c2a', border: '#4caf50' },
  Premium:  { bg: '#fdf8e1', text: '#6b5a1a', border: '#f5c842' },
  Luxury:   { bg: '#fdecea', text: '#6b1a1a', border: '#e53935' },
}

export default function Fabrics({ isAdmin, onUpload }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, cat, p) => {
    setLoading(true)
    setError(null)
    try {
      const { data, total } = await queryFabrics({ search: s, category: cat, page: p })
      setRows(data)
      setTotal(total)
    } catch (e) {
      setError('Could not load fabrics — check Supabase setup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      load(search, category, 0)
    }, 300)
  }, [search, category])

  useEffect(() => {
    load(search, category, page)
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search fabric name or supplier…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.catFilters}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`}
              onClick={() => { setCategory(c); setPage(0) }}
            >{c}</button>
          ))}
        </div>
        {isAdmin && (
          <button className={styles.uploadBtn} onClick={onUpload}>
            ↑ Update catalogue
          </button>
        )}
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const colours = CATEGORY_COLOURS[row.category] || {}
                  return (
                    <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.nameCell}>{row.fabric_name}</td>
                      <td className={styles.supplierCell}>{row.supplier_name}</td>
                      <td className={styles.widthCell}>{row.fabric_width ? `${row.fabric_width}mm` : '—'}</td>
                      <td className={styles.priceCell}>${row.sell_price?.toFixed(2)}/m</td>
                      <td>
                        <span className={styles.catTag} style={{
                          background: colours.bg,
                          color: colours.text,
                          borderColor: colours.border,
                        }}>{row.category}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              <span className={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
