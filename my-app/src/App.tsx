import './App.css'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'

function App() {
  return (
    <>
      <header className="bg-white">
        <div className="px-4 pt-4 mb-6">
          <Navbar />
        </div>
      </header>
      <main className="px-4">
        <h1 className="text-4xl font-bold text-gray-900">TixFlow</h1>
        <p className="mt-2 text-base text-gray-600">Beheer je events eenvoudig</p>
        <EventForm />
      </main>
    </>
  )
}

export default App
