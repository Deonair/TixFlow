import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        setError('Onjuiste inloggegevens')
        return
      }
      // Navigeer naar dashboard
      navigate('/admin')
    } catch {
      setError('Fout tijdens inloggen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Inloggen</h1>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="email">E‑mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'}`}
          >
            {loading ? 'Bezig…' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
