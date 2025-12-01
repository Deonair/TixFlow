import { Link } from 'react-router-dom'

const CheckoutCancel = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900">Betaling geannuleerd</h1>
        <p className="mt-2 text-sm text-gray-600">Je hebt je betaling geannuleerd. Je kunt het opnieuw proberen.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/" className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200">Naar home</Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutCancel

