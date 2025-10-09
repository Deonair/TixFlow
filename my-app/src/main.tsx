// top-level module
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// ... existing code ...
import 'rippleui/dist/css/styles.css'
import './index.css'
// ... existing code ...
import App from './App.tsx'
// ... existing code ...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
