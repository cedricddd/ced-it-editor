import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthGuard from './components/AuthGuard.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthGuard>
        <App />
      </AuthGuard>
    </LanguageProvider>
  </React.StrictMode>,
)
