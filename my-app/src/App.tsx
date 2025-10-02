import './App.css'
import EventForm from './components/EventForm'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TixFlow</h1>
          <p className="mt-2 text-lg text-gray-600">Beheer je events eenvoudig</p>
        </div>
        <EventForm />
      </div>
    </div>
  )
}

export default App
