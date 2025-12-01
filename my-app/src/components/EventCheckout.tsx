import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'

type Selection = { name: string; price: number; qty: number }

type EventSummary = {
  slug: string
  title: string
  date: string
  location: string
  description?: string
  owner?: string
  ownerName?: string
  ticketTypes?: { name: string; price: number; capacity: number }[]
}

type CheckoutState = {
  event?: EventSummary
  selections?: Selection[]
}

const fmtCurrency = (amount: number, currency: string = 'EUR') =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format(amount ?? 0)

const EventCheckout = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as CheckoutState
  const event = state.event
  const selections = Array.isArray(state.selections) ? state.selections : []

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({})

  const total = useMemo(() => {
    return selections.reduce((sum, s) => sum + (s.price ?? 0) * (s.qty ?? 0), 0)
  }, [selections])

  const validate = () => {
    const next: { firstName?: string; lastName?: string; email?: string } = {}
    if (!firstName.trim()) next.firstName = 'Voornaam is verplicht'
    if (!lastName.trim()) next.lastName = 'Achternaam is verplicht'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'E‑mail is ongeldig'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!validate()) return
    if (!event) {
      alert('Geen event geselecteerd. Ga terug en kies je tickets.')
      return
    }
    try {
      const res = await fetch('/api/payments/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: event.slug,
          selections,
          customer: { firstName, lastName, email },
        })
      })
      if (!res.ok) throw new Error('Kon geen checkout sessie maken')
      const data = await res.json()
      const url: string | undefined = data.url as string | undefined
      if (!url) throw new Error('Checkout URL ontbreekt')
      window.location.assign(url)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : ''
      alert(msg ? `Fout: ${msg}` : 'Er ging iets mis bij het starten van je betaling. Probeer opnieuw.')
    }
  }

  if (!event || selections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-semibold text-gray-900">Geen selectie gevonden</h1>
          <p className="mt-2 text-sm text-gray-600">Ga terug en kies je tickets voordat je afrekent.</p>
          <div className="mt-4">
            <Link
              to={slug ? `/event/${slug}` : '/'}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
            >
              Terug naar event
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linker kolom: klantgegevens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">Klantgegevens</h1>
              <p className="mt-1 text-sm text-gray-600">Vul je gegevens in om door te gaan naar betalen.</p>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="firstName">Voornaam *</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className={`py-2.5 px-3 block w-full border rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.firstName ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200'}`}
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="lastName">Achternaam *</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className={`py-2.5 px-3 block w-full border rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.lastName ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200'}`}
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="email">E‑mail *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`py-2.5 px-3 block w-full border rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 ${errors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200'}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  Ga verder naar betalen
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/event/${event?.slug ?? slug ?? ''}`)}
                  className="ml-3 inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Terug
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Rechter kolom: samenvatting */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Samenvatting</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="font-medium text-gray-900">{event.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}
                  {event.location ? ` · ${event.location}` : ''}
                </div>
              </div>

              <div className="space-y-3">
                {selections.map((s, i) => {
                  const line = (s.price ?? 0) * (s.qty ?? 0)
                  return (
                    <div key={`sel-${i}`} className="flex items-center justify-between">
                      <div className="text-gray-800">{s.name} × {s.qty}</div>
                      <div className="text-gray-900 font-medium">{fmtCurrency(line)}</div>
                    </div>
                  )
                })}
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <div className="text-gray-600">Totaal</div>
                  <div className="text-gray-900 font-semibold">{fmtCurrency(total)}</div>
                </div>
                <div className="text-sm text-gray-600">Valuta: EUR</div>
                {event.ownerName && (
                  <div className="text-sm text-gray-600">Organisator: {event.ownerName}</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default EventCheckout
