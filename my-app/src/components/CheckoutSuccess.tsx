import { useSearchParams, Link } from 'react-router-dom'

const CheckoutSuccess = () => {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900">Betaling geslaagd</h1>
        <p className="mt-2 text-sm text-gray-600">Bedankt voor je aankoop! Je order is verwerkt.</p>
        {sessionId && (
          <p className="mt-2 text-xs text-gray-500">Session ID: {sessionId}</p>
        )}
        <div className="mt-4">
          <Link to="/" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700">Naar home</Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccess

