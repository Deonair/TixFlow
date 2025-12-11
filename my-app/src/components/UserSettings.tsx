import React, { useEffect, useState } from 'react'

type TabKey = 'profile' | 'payment'
type UserMe = { name: string; email: string; organization?: string; iban?: string; kvk?: string; btw?: string; billingContact?: string }

const UserSettings = () => {
  const [active, setActive] = useState<TabKey>('profile')
  const [user, setUser] = useState<UserMe | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [pwInput, setPwInput] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)
  const [kvk, setKvk] = useState('')
  const [btw, setBtw] = useState('')
  const [kvkLocked, setKvkLocked] = useState(false)
  const [btwLocked, setBtwLocked] = useState(false)
  const [iban, setIban] = useState('')
  const [orgPay, setOrgPay] = useState('')
  const [contact, setContact] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [payOk, setPayOk] = useState(false)
  const [payFieldErrors, setPayFieldErrors] = useState<Partial<Record<'organization' | 'iban' | 'kvk' | 'btw' | 'billingContact', string>>>({})
  // KVK verificatie UI verwijderd

  useEffect(() => {
    let cancelled = false
    const loadMe = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setUser(data)
          setNameInput(data?.name || '')
          setEmailInput(data?.email || '')
          setIban(data?.iban || '')
          setKvk(data?.kvk || '')
          setBtw(data?.btw || '')
          setOrgPay(data?.organization || '')
          setContact(data?.billingContact || '')
          setKvkLocked(!!data?.kvk)
          setBtwLocked(!!data?.btw)
        }
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

              <form
                className="mt-6 space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setSaveError(null)
                  setSaveOk(false)
                  setSaveLoading(true)
                  try {
                    const payload: Partial<{ name: string; email: string; password: string; confirm: string }> = {}
                    if (nameInput && nameInput !== user?.name) payload.name = nameInput
                    if (emailInput && emailInput !== user?.email) payload.email = emailInput
                    if (pwInput || pwConfirm) {
                      payload.password = pwInput
                      payload.confirm = pwConfirm
                    }
                    const res = await fetch('/api/users/me', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(payload)
                    })
                    if (!res.ok) {
                      let msg = 'Opslaan mislukt'
                      try {
                        const data = await res.json() as { message?: string }
                        msg = data?.message || msg
                      } catch (err) { void err }
                      setSaveError(msg)
                      return
                    }
                    const updated = await res.json()
                    setUser(updated)
                    setSaveOk(true)
                    setPwInput('')
                    setPwConfirm('')
                  } finally {
                    setSaveLoading(false)
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Naam</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nieuw wachtwoord</label>
                    <input
                      type="password"
                      value={pwInput}
                      onChange={(e) => setPwInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Het huidige wachtwoord wordt om veiligheidsredenen niet getoond.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bevestig wachtwoord</label>
                    <input
                      type="password"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className={`inline-flex items-center rounded-lg px-4 py-2.5 text-white ${saveLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {saveLoading ? 'Opslaan…' : 'Opslaan'}
                  </button>
                  {saveOk && <span className="text-sm text-green-600">Opgeslagen</span>}
                  {saveError && <span className="text-sm text-red-600">{saveError}</span>}
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
                onSubmit={async (e) => {
                  e.preventDefault()
                  setPayError(null)
                  setPayFieldErrors({})
                  setPayOk(false)
                  setPayLoading(true)
                  try {
                    const payload: Partial<{ organization: string; iban: string; kvk: string; btw: string; billingContact: string }> = {}
                    if (iban) payload.iban = iban.replace(/\s+/g, '').toUpperCase()
                    if (orgPay) payload.organization = orgPay
                    if (contact) payload.billingContact = contact
                    if (kvk) payload.kvk = kvk
                    if (btw) payload.btw = btw
                    const res = await fetch('/api/users/me', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(payload)
                    })
                    if (!res.ok) {
                      let msg = 'Opslaan mislukt'
                      try {
                        const data = await res.json() as { message?: string; errors?: Partial<Record<'organization' | 'iban' | 'kvk' | 'btw' | 'billingContact', string>> }
                        msg = data?.message || msg
                        if (data?.errors) setPayFieldErrors(data.errors)
                      } catch {
                        console.warn('Kon foutdetails niet lezen uit response')
                      }
                      setPayError(msg)
                      return
                    }
                    const updated = await res.json()
                    setUser(updated)
                    setIban(updated?.iban || '')
                    setKvk(updated?.kvk || '')
                    setBtw(updated?.btw || '')
                    setOrgPay(updated?.organization || '')
                    setContact(updated?.billingContact || '')
                    if (updated?.kvk) {
                      setKvkLocked(true)
                    }
                    if (btw) setBtwLocked(true)
                    setPayOk(true)
                  } finally {
                    setPayLoading(false)
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">IBAN</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="NL00BANK0123456789"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {payFieldErrors.iban && <p className="mt-1 text-xs text-red-600">{payFieldErrors.iban}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organisatie</label>
                  <input
                    type="text"
                    value={orgPay}
                    onChange={(e) => setOrgPay(e.target.value)}
                    placeholder="Organisatie"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {payFieldErrors.organization && <p className="mt-1 text-xs text-red-600">{payFieldErrors.organization}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contactnaam</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={user?.name ? user.name : 'Naam van contactpersoon'}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {payFieldErrors.billingContact && <p className="mt-1 text-xs text-red-600">{payFieldErrors.billingContact}</p>}
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
                    {payFieldErrors.kvk && <p className="mt-1 text-xs text-red-600">{payFieldErrors.kvk}</p>}
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
                    {payFieldErrors.btw && <p className="mt-1 text-xs text-red-600">{payFieldErrors.btw}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={payLoading}
                    className={`inline-flex items-center rounded-lg px-4 py-2.5 text-white ${payLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {payLoading ? 'Opslaan…' : 'Opslaan'}
                  </button>
                  {payOk && <span className="text-sm text-green-600">Opgeslagen</span>}
                  {payError && <span className="text-sm text-red-600">{payError}</span>}
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
