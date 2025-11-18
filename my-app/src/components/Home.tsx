import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')

  const goToEvent = () => {
    const s = slug.trim()
    if (!s) return
    navigate(`/event/${s}`)
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-white shadow-xl p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Welkom bij TixFlow</h1>
          <p className="mt-2 text-sm text-gray-600">Organiseer events of bekijk je publieke eventpagina.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Voor organisatoren</h2>
            <p className="mt-1 text-sm text-gray-600">Beheer events, maak nieuwe aan en deel je link.</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate('/organizer')}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Ga naar dashboard
              </button>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Registreer
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Voor bezoekers</h2>
            <p className="mt-1 text-sm text-gray-600">Navigeer naar de publieke eventpagina met een slug.</p>
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Bijv. summer-fest-2025"
                className="py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
              />
              <button
                onClick={goToEvent}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Open
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-sm font-semibold text-gray-900">Snelkoppelingen</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => navigate('/admin/events')} className="inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100">Beheer events</button>
            <button onClick={() => navigate('/admin/event/new')} className="inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100">Nieuw event</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home