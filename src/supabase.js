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

export async function loadConfig() {
  try {
    const rows = await sb('GET', 'quote_config?id=eq.1&select=config')
    if (rows && rows.length > 0 && rows[0].config) return rows[0].config
  } catch (e) {
    console.warn('loadConfig failed:', e)
  }
  return null
}

export async function saveConfig(config) {
  try {
    await sb('PATCH', 'quote_config?id=eq.1', { config })
  } catch {
    try {
      await sb('POST', 'quote_config', { id: 1, config })
    } catch (e) {
      throw new Error('Save failed')
    }
  }
}
