const SUPABASE_URL = 'https://lozusjufiisbokjnadhy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3lWZlhxMwQ4vsgGnbSnVzg_tHqlzEnq'

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function loadFabricMeta() {
  try {
    const rows = await sb('GET', 'fabric_meta?id=eq.1&select=last_updated,next_reminder')
    if (rows && rows.length > 0) return rows[0]
  } catch (e) {}
  return null
}

export async function saveFabricMeta(lastUpdated, nextReminder) {
  try {
    await sb('PATCH', 'fabric_meta?id=eq.1', { last_updated: lastUpdated, next_reminder: nextReminder })
  } catch {
    try {
      await sb('POST', 'fabric_meta', { id: 1, last_updated: lastUpdated, next_reminder: nextReminder })
    } catch (e) {
      console.error('Could not save fabric meta:', e)
    }
  }
}

export function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

export function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function insertFabric(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fabrics`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(row)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateFabric(id, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fabrics?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(row)
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteFabric(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fabrics?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
  })
  if (!res.ok) throw new Error(await res.text())
}

export function getCategory(price) {
  const p = parseFloat(price)
  if (isNaN(p)) return null
  if (p < 25) return 'Standard'
  if (p < 50) return 'Plus'
  if (p < 75) return 'Premium'
  return 'Luxury'
}
