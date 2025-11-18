import { useNavigate } from 'react-router-dom'

const OrganizerLanding = () => {
  const navigate = useNavigate()

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white shadow-xl p-8 border border-gray-100">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Welkom, organisator</h1>
          <p className="mt-1 text-sm text-gray-600">Beheer je events en maak nieuwe aan vanuit dit dashboard.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Bekijk events
          </button>
          <button
            onClick={() => navigate('/admin/event/new')}
            className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Nieuw event
          </button>
        </div>
      </div>
    </section>
  )
}

export default OrganizerLanding