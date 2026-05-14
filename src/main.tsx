import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { fontSize: '14px' },
        success: { iconTheme: { primary: '#1E8449', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#C0392B', secondary: '#fff' } },
      }}
    />
  </StrictMode>,
)