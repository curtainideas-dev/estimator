import { useState } from 'react'
import { PASSWORD } from '../constants'
import styles from './Login.module.css'

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  function attempt() {
    if (pw === PASSWORD) {
      onLogin()
    } else {
      setError('Incorrect password')
      setPw('')
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>Curtain Ideas</div>
        <div className={styles.title}>Estimator</div>
        <input
          type="password"
          className={styles.input}
          placeholder="Enter password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <div className={styles.error}>{error}</div>
        <button className={styles.btn} onClick={attempt}>Enter</button>
      </div>
    </div>
  )
}
