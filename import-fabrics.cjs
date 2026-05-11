const XLSX = require('xlsx')

const SUPABASE_URL = 'https://lozusjufiisbokjnadhy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3lWZlhxMwQ4vsgGnbSnVzg_tHqlzEnq'
const BATCH_SIZE = 500

function getCategory(price) {
  const p = parseFloat(price)
  if (isNaN(p)) return null
  if (p < 25) return 'Standard'
  if (p < 50) return 'Plus'
  if (p < 75) return 'Premium'
  return 'Luxury'
}

async function deleteFabrics() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fabrics?id=gt.0`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    }
  })
  console.log('Cleared existing data, status:', res.status)
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

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node import-fabrics.cjs <path-to-xlsx>')
    process.exit(1)
  }

  console.log('Reading spreadsheet...')
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: null })

  const rows = []
  for (const r of rawRows) {
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

  console.log(`Found ${rows.length} valid fabric rows`)
  console.log('Clearing existing data...')
  await deleteFabrics()

  console.log(`Importing in batches of ${BATCH_SIZE}...`)
  let imported = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await insertBatch(rows.slice(i, i + BATCH_SIZE))
    imported += Math.min(BATCH_SIZE, rows.length - i)
    process.stdout.write(`\r${imported}/${rows.length} imported...`)
  }

  console.log('\nDone!')
}

main().catch(err => {
  console.error('\nError:', err.message)
  process.exit(1)
})
