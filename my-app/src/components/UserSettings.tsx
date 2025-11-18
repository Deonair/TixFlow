import React, { useEffect, useState } from 'react'

type TabKey = 'profile' | 'payment'
type UserMe = { name: string; email: string; organization?: string }

const UserSettings = () => {
  const [active, setActive] = useState<TabKey>('profile')
  const [user, setUser] = useState<UserMe | null>(null)
  const [kvk, setKvk] = useState('')
  const [btw, setBtw] = useState('')
  const [kvkLocked, setKvkLocked] = useState(false)
  const [btwLocked, setBtwLocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadMe = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setUser(data)
      } catch {
        // negeer fouten hier; formulier blijft bruikbaar
      }
    }
    loadMe()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gebruikersinstellingen</h1>
        <p className="mt-1 text-sm text-gray-600">Beheer je persoonlijke gegevens en betaalgegevens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6">
        {/* Zijmenu */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 lg:p-5 h-fit">
          <nav className="flex lg:flex-col gap-2" aria-label="Instellingen menu">
            <button
              type="button"
              onClick={() => setActive('profile')}
              className={
                `text-left w-full rounded-lg px-4 py-2.5 border ${active === 'profile'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`
              }
            >
              Gegevens aanpassen
            </button>
            <button
              type="button"
              onClick={() => setActive('payment')}
              className={
                `text-left w-full rounded-lg px-4 py-2.5 border ${active === 'payment'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`
              }
            >
              Betaalgegevens
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          {active === 'profile' && (
            <div className="p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900">Gegevens aanpassen</h2>
              <p className="mt-1 text-sm text-gray-600">Werk je naam, e-mail en wachtwoord bij.</p>

              {/* Organisatie (alleen-lezen) */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Organisatie</label>
                <input
                  type="text"
                  value={user?.organization ?? ''}
                  placeholder={user?.organization ? user.organization : 'Niet ingesteld'}
                  disabled
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Deze waarde is vergrendeld en kan niet aangepast worden.</p>
              </div>

              <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Naam</label>
                  <input
                    type="text"
                    placeholder={user?.name ? user.name : 'Voor- en achternaam'}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input
                    type="email"
                    placeholder={user?.email ? user.email : 'jij@voorbeeld.nl'}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nieuw wachtwoord</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Het huidige wachtwoord wordt om veiligheidsredenen niet getoond.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bevestig wachtwoord</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
                  >
                    Opslaan
                  </button>
                  <span className="text-sm text-gray-500">Wijzigingen worden lokaal gesimuleerd.</span>
                </div>
              </form>
            </div>
          )}

          {active === 'payment' && (
            <div className="p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900">Betaalgegevens</h2>
              <p className="mt-1 text-sm text-gray-600">IBAN en bedrijfsgegevens voor uitbetalingen.</p>

              <form
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (kvk) setKvkLocked(true)
                  if (btw) setBtwLocked(true)
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">IBAN</label>
                  <input
                    type="text"
                    placeholder="NL00 BANK 0123 4567 89"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organisatie</label>
                  <input
                    type="text"
                    defaultValue={user?.organization ?? ''}
                    placeholder="Organisatie"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact voornaam</label>
                    <input
                      type="text"
                      placeholder={user?.name ? user.name.split(' ')[0] : 'Voornaam'}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact achternaam</label>
                    <input
                      type="text"
                      placeholder={user?.name ? (user.name.split(' ').slice(1).join(' ') || 'Achternaam') : 'Achternaam'}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">KvK-nummer</label>
                    <input
                      type="text"
                      value={kvk}
                      onChange={(e) => setKvk(e.target.value)}
                      placeholder={kvkLocked ? kvk || '—' : '12345678'}
                      disabled={kvkLocked}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${kvkLocked ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">{kvkLocked ? 'Dit veld is vergrendeld.' : 'Wordt vergrendeld na opslaan.'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BTW-nummer</label>
                    <input
                      type="text"
                      value={btw}
                      onChange={(e) => setBtw(e.target.value)}
                      placeholder={btwLocked ? btw || '—' : 'NL123456789B01'}
                      disabled={btwLocked}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${btwLocked ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">{btwLocked ? 'Dit veld is vergrendeld.' : 'Wordt vergrendeld na opslaan.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
                  >
                    Opslaan
                  </button>
                  <span className="text-sm text-gray-500">Velden zijn demovelden; opslag nog niet gekoppeld.</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default UserSettings