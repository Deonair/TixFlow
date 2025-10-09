import './App.css'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'

function App() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <header className="py-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900">TixFlow</h1>
        <p className="mt-2 text-base text-gray-600">Beheer je events eenvoudig</p>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <EventForm />
      </div>
    </main>
  )
}

export default App
