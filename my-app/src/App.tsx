import './App.css'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import EventLanding from './components/EventLanding'
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
          <Route path="/" element={<Navigate to="/admin/events" replace />} />
          <Route path="/admin/events" element={<EventList />} />
          <Route path="/admin/event/new" element={<EventForm />} />
          <Route path="/admin/event/:id" element={<EventDetail />} />
          <Route path="/admin/event/:id/edit" element={<EventEdit />} />
          <Route path="/event/:slug" element={<EventLanding />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
