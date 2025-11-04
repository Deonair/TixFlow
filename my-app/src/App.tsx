import './App.css'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import EventEdit from './components/EventEdit'

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
    <Router>
      <Navbar />
      <main className="px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/event/new" element={<EventForm />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/event/:id/edit" element={<EventEdit />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
