import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type OrderItem = { name: string; quantity: number; unitAmount: number }
type Order = { _id: string; customerEmail: string; status: string; amountTotal: number; currency: string; createdAt: string; items?: OrderItem[] }

function OrdersList() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!id) return
      try {
        const res = await fetch(`/api/orders?eventId=${id}&limit=200`)
        if (!res.ok) throw new Error('Kon orders niet laden')
        const data = await res.json()
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <section className="mx-auto max-w-5xl px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/event/${id}`)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar event
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Alle orders</h1>
        </div>
        <div className="w-full sm:w-auto">
          <a
            href={`/api/orders/export?eventId=${id}`}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-900 hover:bg-gray-100"
          >
            Exporteer CSV
          </a>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        {loading && <div className="p-5 text-gray-600">Laden...</div>}
        {!loading && error && <div className="p-5 text-red-600">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="p-5 text-gray-600">Geen bestellingen</div>
        )}
        {!loading && !error && orders.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totaal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o._id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(o.createdAt).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{o.customerEmail}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{o.status}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">€ {(o.amountTotal / 100).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {(o.items || []).map((i, idx) => (
                      <span key={idx} className="inline-block mr-2 text-gray-700">{i.name} × {i.quantity}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default OrdersList
