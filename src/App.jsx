import { useState, useEffect } from 'react'
import Login from './Login'
import Calculator from './Calculator'
import Admin from './Admin'
import PricingCheck from './PricingCheck'
import { loadConfig } from './supabase'
import defaultConfig from './defaultConfig'
import { ROLLER_GRIDS } from './rollerGrids'
import styles from './App.module.css'

export default function App() {
  const [role, setRole] = useState(null) // null | 'user' | 'admin'
  const [tab, setTab] = useState('calc')
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role) {
      loadConfig().then(remote => {
        const merged = { ...defaultConfig, ...remote }
        if (!merged.rollerGrids) merged.rollerGrids = JSON.parse(JSON.stringify(ROLLER_GRIDS))
        setConfig(merged)
        setLoading(false)
      })
    }
  }, [role])

  if (!role) return <Login onLogin={setRole} />

  const isAdmin = role === 'admin'

  const tabs = [
    { id: 'calc', label: 'Calculator' },
    ...(isAdmin ? [
      { id: 'pricing', label: 'Pricing check' },
      { id: 'admin', label: 'Admin' },
    ] : []),
  ]

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brand}>Curtain Ideas</span>
        <span className={styles.title}>Estimator</span>
        <span className={styles.roleTag}>{isAdmin ? 'Admin' : ''}</span>
      </header>

      <nav className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : tab === 'calc' ? (
          <Calculator config={config} />
        ) : tab === 'pricing' ? (
          <PricingCheck config={config} />
        ) : (
          <Admin config={config} onSave={setConfig} />
        )}
      </main>
    </div>
  )
}
