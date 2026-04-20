import { useState } from 'react'
import styles from './Login.module.css'

const PASSWORD = 'curtainideas'
const ADMIN_PASSWORD = 'curtainadmin'

export default function Login({ onLogin }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value === ADMIN_PASSWORD) {
      onLogin('admin')
    } else if (value === PASSWORD) {
      onLogin('user')
    } else {
      setError('Incorrect password')
      setValue('')
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>Curtain Ideas</div>
        <div className={styles.title}>Estimator</div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter password"
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            className={styles.input}
            autoFocus
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.btn}>Enter</button>
        </form>
      </div>
    </div>
  )
}
