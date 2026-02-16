import React, { useState, useEffect } from 'react'
import { checkAppAccess, redirectToSso } from '../lib/auth'

const SAAS_URL = import.meta.env.VITE_SAAS_URL || 'https://saas.ced-it.be'
const APP_SLUG = import.meta.env.VITE_APP_SLUG || 'image-editor'

/**
 * AuthGuard — Protège l'application avec vérification d'accès SaaS.
 *
 * - Vérifie le token JWT à chaque chargement
 * - Affiche une bannière trial si l'accès est de type "trial"
 * - Redirige vers le SaaS si non autorisé
 */
export default function AuthGuard({ children }) {
  const [authState, setAuthState] = useState('loading') // 'loading' | 'authorized' | 'unauthorized'
  const [accessInfo, setAccessInfo] = useState(null)
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false)

  useEffect(() => {
    checkAppAccess().then((result) => {
      if (result.status === 'authorized') {
        setAuthState('authorized')
        setAccessInfo(result)
      } else {
        setAuthState('unauthorized')
      }
    })
  }, [])

  /* ---- États de chargement / redirection ---- */
  if (authState === 'loading') {
    return <LoadingScreen />
  }

  if (authState === 'unauthorized') {
    return <UnauthorizedScreen />
  }

  /* ---- App autorisée ---- */
  const showTrialBanner = accessInfo?.accessType === 'trial' && !trialBannerDismissed

  return (
    <>
      {showTrialBanner && (
        <TrialBanner
          expiresAt={accessInfo.trialExpiresAt}
          onDismiss={() => setTrialBannerDismissed(true)}
        />
      )}
      <div style={showTrialBanner ? { paddingTop: '40px' } : undefined}>
        {children}
      </div>
    </>
  )
}

/* ---- Composants internes ---- */

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a1628]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-[rgba(0,212,255,0.2)] border-t-[#00d4ff] animate-spin"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        <p className="text-[#94a3b8] text-sm">Vérification de l'accès…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function UnauthorizedScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a1628] p-6">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h2 className="text-white text-xl font-semibold mb-2">Accès requis</h2>
          <p className="text-[#94a3b8] text-sm">
            Connectez-vous ou démarrez votre essai gratuit de 24h pour utiliser
            l'éditeur d'images.
          </p>
        </div>
        <button
          onClick={redirectToSso}
          className="w-full py-3 px-6 rounded-lg text-white font-medium text-sm"
          style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)' }}
        >
          Se connecter via Ced-IT
        </button>
        <a
          href={`${SAAS_URL}/apps/${APP_SLUG}`}
          className="text-[#00d4ff] text-sm hover:underline"
        >
          Voir les offres →
        </a>
      </div>
    </div>
  )
}

function TrialBanner({ expiresAt, onDismiss }) {
  const [hoursLeft, setHoursLeft] = useState(null)

  useEffect(() => {
    if (!expiresAt) return
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setHoursLeft(diff > 0 ? Math.ceil(diff / (1000 * 60 * 60)) : 0)
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm"
      style={{ background: 'linear-gradient(135deg, #00d4ff22 0%, #0066ff22 100%)', borderBottom: '1px solid rgba(0,212,255,0.3)' }}
    >
      <div className="flex items-center gap-2 text-[#94a3b8]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>
          Essai gratuit —{' '}
          <span className="text-white font-medium">
            {hoursLeft !== null ? `${hoursLeft}h restante${hoursLeft > 1 ? 's' : ''}` : '…'}
          </span>
        </span>
        <a
          href={`${SAAS_URL}/apps/${APP_SLUG}`}
          className="text-[#00d4ff] hover:underline ml-2"
        >
          Passer à l'abonnement →
        </a>
      </div>
      <button
        onClick={onDismiss}
        className="text-[#64748b] hover:text-white transition-colors"
        aria-label="Fermer la bannière"
      >
        ✕
      </button>
    </div>
  )
}
