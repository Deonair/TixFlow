import { useState } from 'react'

type RegisterForm = {
  name: string
  email: string
  organization: string
  password: string
  confirm: string
}

const MIN_PASSWORD = 8

const Register = () => {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    organization: '',
    password: '',
    confirm: ''
  })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordScore = (() => {
    const p = form.password
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[a-z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    const percent = (score / 5) * 100
    const label = score <= 2 ? 'Zwak' : score === 3 ? 'Gemiddeld' : score === 4 ? 'Sterk' : 'Zeer sterk'
    const color = score <= 2 ? 'bg-red-500' : score === 3 ? 'bg-yellow-500' : score === 4 ? 'bg-green-500' : 'bg-emerald-600'
    return { percent, label, color }
  })()

  const validate = () => {
    const next: Partial<RegisterForm> = {}
    const emailValid = /^\S+@\S+\.\S+$/.test(form.email)
    if (!form.name.trim()) next.name = 'Naam is verplicht'
    if (!emailValid) next.email = 'E‑mail is ongeldig'
    if (!form.organization.trim()) next.organization = 'Organisatie is verplicht'
    if (!form.password || form.password.length < MIN_PASSWORD) next.password = `Minimaal ${MIN_PASSWORD} tekens`
    if (form.password !== form.confirm) next.confirm = 'Wachtwoorden komen niet overeen'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/organizers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organization: form.organization,
          password: form.password
        })
      })
      if (!res.ok) {
        let data: unknown = null
        try { data = await res.json() } catch {}
        const serverErrors = typeof data === 'object' && data && 'errors' in data ? (data as any).errors : {}
        setErrors((prev) => ({ ...prev, ...serverErrors }))
        return
      }
      localStorage.setItem('hasRegistered', '1')
      setIsSubmitted(true)
      if (typeof window !== 'undefined') {
        window.location.assign('/organizer')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">Registratie ontvangen</h2>
            <p className="mt-2 text-sm text-gray-600">Je accountaanvraag is opgeslagen.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setForm({ name: '', email: '', organization: '', password: '', confirm: '' })
                  setIsSubmitted(false)
                }}
                className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Nieuwe registratie
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-white shadow-xl p-8 border border-gray-100">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Registreer als organisator</h1>
          <p className="mt-1 text-sm text-gray-600">Maak een beheeraccount aan om events te organiseren.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-2" htmlFor="name">Naam *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                placeholder="Volledige naam"
                className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.name ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium mb-2" htmlFor="email">E‑mail *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="naam@bedrijf.nl"
                className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2" htmlFor="organization">Organisatie *</label>
            <input
              id="organization"
              name="organization"
              type="text"
              value={form.organization}
              onChange={onChange}
              placeholder="Bedrijfsnaam"
              className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.organization ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
            />
            {errors.organization && <p className="mt-1 text-sm text-red-600">{errors.organization}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-2" htmlFor="password">Wachtwoord *</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  placeholder="Minimaal 8 tekens"
                  className={`py-2.5 pl-3 pr-12 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.password ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500"
                >
                  {showPassword ? 'Verberg' : 'Toon'}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`${passwordScore.color} h-2`} style={{ width: `${passwordScore.percent}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">{passwordScore.label}</span>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium mb-2" htmlFor="confirm">Bevestig wachtwoord *</label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={onChange}
                  placeholder="Herhaal wachtwoord"
                  className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.confirm ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
                />
              </div>
              {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className={`inline-flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${submitLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'}`}
            >
              {submitLoading ? 'Versturen…' : 'Registreer'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Register