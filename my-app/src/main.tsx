// top-level module
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// ... existing code ...
import './index.css'
// ... existing code ...
import App from './App.tsx'
// ... existing code ...

// Enforce light mode at runtime for all users
try {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.setProperty('color-scheme', 'light');
} catch {
  console.warn('Kon light-mode forceren niet toepassen')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
