import 'bootstrap/dist/css/bootstrap.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { TranslationProvider } from './i18n/index.jsx'
import { AuthProvider } from './auth/provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TranslationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TranslationProvider>
  </StrictMode>,
)