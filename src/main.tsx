import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FerreteriaProLanding from './pages/Home'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FerreteriaProLanding />
  </StrictMode>,
)
