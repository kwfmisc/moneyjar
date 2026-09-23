import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Check, Coins, Plus, Trash2, Users } from 'lucide-react'

const contributionsStorageKey = 'money-jar-contributions-v2'
const goalStorageKey = 'money-jar-goal-v2'
const sheetsUrl = import.meta.env.VITE_SHEETS_WEB_APP_URL || ''

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function App() {
  const [goal, setGoal] = useState(() => Number(window.localStorage.getItem(goalStorageKey)) || '')
  const [contributions, setContributions] = useState(() => {
    try {
      const saved = window.localStorage.getItem(contributionsStorageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), person: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(contributionsStorageKey, JSON.stringify(contributions))
  }, [contributions])

  useEffect(() => {
    if (goal) window.localStorage.setItem(goalStorageKey, String(goal))
    if (!sheetsUrl) return

    fetch(sheetsUrl)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.contributions)) setContributions(data.contributions)
        if (data.goal) setGoal(Number(data.goal))
      })
      .catch(() => {})
  }, [])

  const total = useMemo(() => contributions.reduce((sum, item) => sum + item.amount, 0), [contributions])
  const progress = goal > 0 ? (total / goal) * 100 : 0
  const visualFill = Math.min(progress, 100)
  const remaining = Math.max(goal - total, 0)

  function handleSubmit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.person.trim() || !form.date) return

    const contribution = { id: Date.now(), amount, date: form.date, person: form.person.trim() }
    setContributions((current) => [contribution, ...current])
    if (sheetsUrl) fetch(sheetsUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'add', contribution, goal }) }).catch(() => {})
    setForm({ amount: '', date: new Date().toISOString().slice(0, 10), person: '' })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function removeContribution(id) {
    setContributions((current) => current.filter((item) => item.id !== id))
    if (sheetsUrl) fetch(sheetsUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'delete', id }) }).catch(() => {})
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Money Jar home">
          <span className="mark"><Coins size={18} strokeWidth={2.5} /></span>
          <span>money<span className="wordmark-accent">jar</span></span>
        </a>
        <div className="topbar-meta"><span className="pulse-dot" /> Shared savings space</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">The little things add up</p>
          <h1>Keep your eye<br /><em>on the prize.</em></h1>
          <p className="hero-intro">A clear, cheerful place to see every contribution move you closer to what matters.</p>
          <div className="stats-row">
            <div>
              <span className="stat-label">Current total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <div className="stat-divider" />
            <div>
              <span className="stat-label">To goal</span>
              <strong>{goal ? (remaining > 0 ? formatMoney(remaining) : 'Goal reached!') : 'Set a goal'}</strong>
            </div>
          </div>
        </div>

        <div className="jar-stage" aria-label={`${formatMoney(total)} saved toward a ${formatMoney(goal)} goal`}>
          <div className="spark spark-one" />
          <div className="spark spark-two" />
          <div className="spark spark-three" />
          <div className="jar-lid"><span /></div>
          <div className="jar-neck" />
          <div className="jar-body">
            <div className="jar-shine" />
            <div className="liquid" style={{ height: `${visualFill}%` }}>
              <div className="liquid-line" />
              <div className="coin coin-one">$</div>
              <div className="coin coin-two">$</div>
              <div className="coin coin-three">$</div>
              <div className="coin coin-four">$</div>
              <div className="coin coin-five">$</div>
              <div className="coin coin-six">$</div>
            </div>
          </div>
          <div className="jar-base" />
          <div className="jar-caption"><strong>{goal ? `${Math.round(progress)}%` : '--'}</strong><span>{goal ? 'of your goal' : 'set a goal'}</span></div>
        </div>
      </section>

      <section className="workspace">
        <div className="panel contribution-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Add to the jar</p>
              <h2>New contribution</h2>
            </div>
            <span className="panel-icon"><Plus size={20} /></span>
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              <span>Amount</span>
              <div className="input-with-symbol"><span>$</span><input type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div>
            </label>
            <label>
              <span>Who contributed?</span>
              <div className="input-with-icon"><Users size={17} /><input type="text" placeholder="Enter a name" value={form.person} onChange={(event) => setForm({ ...form, person: event.target.value })} required /></div>
            </label>
            <label>
              <span>Date</span>
              <div className="input-with-icon"><CalendarDays size={17} /><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div>
            </label>
            <button className="primary-button" type="submit">{saved ? <><Check size={17} /> Added to the jar</> : <>Add contribution <ArrowUpRight size={17} /></>}</button>
          </form>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading activity-heading">
            <div>
              <p className="section-kicker">The full picture</p>
              <h2>Contributions</h2>
            </div>
            <div className="goal-control"><label htmlFor="goal">Goal</label><div><span>$</span><input id="goal" type="number" min="1" placeholder="Set goal" value={goal} onChange={(event) => { const nextGoal = Number(event.target.value) || ''; setGoal(nextGoal); if (nextGoal) window.localStorage.setItem(goalStorageKey, String(nextGoal)) }} /></div></div>
          </div>
          <div className="contribution-list">
            {contributions.length === 0 ? <div className="empty-state">Your first contribution starts the story.</div> : contributions.map((item) => (
              <div className="contribution-item" key={item.id}>
                <div className="avatar">{item.person.slice(0, 1).toUpperCase()}</div>
                <div className="contributor-info"><strong>{item.person}</strong><span>{formatDate(item.date)}</span></div>
                <strong className="contribution-amount">+{formatMoney(item.amount)}</strong>
                <button className="delete-button" type="button" onClick={() => removeContribution(item.id)} aria-label={`Remove ${item.person}'s contribution`} title="Remove contribution"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="progress-footer"><div className="progress-meta"><span>{goal ? `Progress toward ${formatMoney(goal)}` : 'Enter a goal to track progress'}</span><strong>{goal ? `${Math.round(progress)}%` : '--'}</strong></div><div className="progress-track"><div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} /></div>{progress > 100 && <p className="over-goal">You are {formatMoney(total - goal)} over goal. Keep going.</p>}</div>
        </div>
      </section>
      <footer><span>Built for shared wins.</span><span>{contributions.length} {contributions.length === 1 ? 'contribution' : 'contributions'} logged</span></footer>
    </main>
  )
}

export default App
