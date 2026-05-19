import { useState, useEffect } from 'react'
import { loadFabricMeta, formatDate } from './fabricMeta'
import styles from './FabricReminderBanner.module.css'

export default function FabricReminderBanner() {
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    loadFabricMeta().then(setMeta)
  }, [])

  if (!meta) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const reminder = meta.next_reminder ? new Date(meta.next_reminder) : null
  const isOverdue = reminder && reminder <= today
  const isDueSoon = reminder && !isOverdue && (reminder - today) / (1000 * 60 * 60 * 24) <= 7

  if (!reminder) return null

  const lastUpdatedStr = meta.last_updated ? `Last updated ${formatDate(meta.last_updated)}` : 'Not yet updated'
  const nextStr = `Next update due ${formatDate(meta.next_reminder)}`

  return (
    <div className={`${styles.banner} ${isOverdue ? styles.overdue : isDueSoon ? styles.dueSoon : styles.ok}`}>
      <span className={styles.icon}>{isOverdue ? '⚠' : isDueSoon ? '🔔' : '✓'}</span>
      <span className={styles.text}>
        <strong>Fabric catalogue</strong> · {lastUpdatedStr} · {nextStr}
        {isOverdue && <span className={styles.badge}>Overdue</span>}
        {isDueSoon && !isOverdue && <span className={styles.badgeSoon}>Due soon</span>}
      </span>
    </div>
  )
}
