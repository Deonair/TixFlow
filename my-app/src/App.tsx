import './App.css'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'

function App() {
  useEffect(() => {
    // Initialize Preline JS for interactive components (dropdown, etc.)
    import('preline/preline').then(() => {
      if (window.HSStaticMethods && typeof window.HSStaticMethods.autoInit === 'function') {
        window.HSStaticMethods.autoInit();
      }
    });
  }, []);
  return (
    <>
      <Navbar />
      <main className="px-4">
        <p className="mt-2 text-base text-gray-600">Beheer je events eenvoudig</p>
        <EventForm />
      </main>
    </>
  )
}

export default App
