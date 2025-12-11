import './App.css'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventForm from './components/EventForm'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import EventLanding from './components/EventLanding'
import EventCheckout from './components/EventCheckout.tsx'
import EventEdit from './components/EventEdit'
import Register from './components/Register'
import Home from './components/Home'
import Login from './components/Login'
import RequireAuth from './components/RequireAuth'
import PublicOnly from './components/PublicOnly'
import AdminDashboard from './components/AdminDashboard'
import AuthedToDashboard from './components/AuthedToDashboard'
import UserSettings from './components/UserSettings'
import CheckoutSuccess from './components/CheckoutSuccess'
import CheckoutCancel from './components/CheckoutCancel'
import OrdersList from './components/OrdersList'
import SuperAdmin from './components/SuperAdmin'
import SuperAdminOrganizers from './components/SuperAdminOrganizers'
import SuperAdminEvents from './components/SuperAdminEvents'

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
          <Route path="/" element={<AuthedToDashboard><Home /></AuthedToDashboard>} />
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/events" element={<RequireAuth><EventList /></RequireAuth>} />
          <Route path="/admin/settings" element={<RequireAuth><UserSettings /></RequireAuth>} />
          <Route path="/admin/event/new" element={<RequireAuth><EventForm /></RequireAuth>} />
          <Route path="/admin/event/:id" element={<RequireAuth><EventDetail /></RequireAuth>} />
          <Route path="/admin/event/:id/edit" element={<RequireAuth><EventEdit /></RequireAuth>} />
          <Route path="/admin/event/:id/orders" element={<RequireAuth><OrdersList /></RequireAuth>} />
          <Route path="/event/:slug" element={<EventLanding />} />
          <Route path="/event/:slug/checkout" element={<EventCheckout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/superadmin/organizers" element={<SuperAdminOrganizers />} />
          <Route path="/superadmin/events" element={<SuperAdminEvents />} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          {/* Organizer route verwijderd; landing na login is /admin/events */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;
