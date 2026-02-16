/**
 * auth.js — Gestion de l'authentification SSO avec le SaaS Ced-IT
 *
 * Flow :
 * 1. L'app reçoit un token JWT dans l'URL (?token=<JWT>) après redirection SSO
 * 2. Le token est stocké en sessionStorage (valide pour la session navigateur)
 * 3. À chaque chargement, le token est vérifié auprès du SaaS via l'API /verify
 * 4. Si invalide/absent → redirection vers le SaaS pour authentification
 */

const SAAS_URL = import.meta.env.VITE_SAAS_URL || 'https://saas.ced-it.be'
const APP_SLUG = import.meta.env.VITE_APP_SLUG || 'image-editor'
const APP_URL  = import.meta.env.VITE_APP_URL  || window.location.origin

const TOKEN_KEY = `saas_token_${APP_SLUG}`

/** Récupère l'URL de login SSO */
function getSsoLoginUrl() {
  const redirectUrl = `${APP_URL}/callback`
  return `${SAAS_URL}/auth/app-login?appSlug=${encodeURIComponent(APP_SLUG)}&redirectUrl=${encodeURIComponent(redirectUrl)}`
}

/** Lit le token depuis l'URL et le stocke si présent, puis nettoie l'URL */
export function consumeTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
    // Nettoyer le token de l'URL sans recharger la page
    params.delete('token')
    const cleanUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
    window.history.replaceState({}, '', cleanUrl)
    return token
  }

  return null
}

/** Récupère le token stocké en session */
export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

/** Supprime le token (déconnexion) */
export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * Décode le payload JWT sans vérifier la signature (client-side).
 * Utilisé uniquement pour lire l'expiry et les métadonnées affichées.
 */
export function decodeTokenPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4
    const base64 = pad ? padded + '='.repeat(4 - pad) : padded
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/** Vérifie si un token est expiré localement (sans appel réseau) */
export function isTokenExpiredLocally(token) {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) return true
  return Math.floor(Date.now() / 1000) >= payload.exp
}

/**
 * Vérifie le token auprès de l'API SaaS.
 * Retourne le payload d'accès, null si invalide (401), ou 'network_error' si erreur réseau.
 *
 * @param {string} token
 * @returns {Promise<{hasAccess: boolean, accessType: string, email: string, trialExpiresAt: string|null} | null | 'network_error'>}
 */
export async function verifyTokenWithSaas(token) {
  try {
    const res = await fetch(`${SAAS_URL}/api/apps/${APP_SLUG}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) return null
    if (!res.ok) return null

    return await res.json()
  } catch {
    return 'network_error'
  }
}

/**
 * Point d'entrée principal — à appeler au démarrage de l'app.
 *
 * Retourne :
 * - { status: 'authorized', accessType, email, trialExpiresAt } si accès OK
 * - { status: 'unauthorized' } si pas d'accès (la fonction redirige automatiquement)
 * - { status: 'error' } en cas d'erreur réseau (accès offline refusé)
 */
export async function checkAppAccess() {
  // 1. Consommer le token depuis l'URL s'il est présent
  consumeTokenFromUrl()

  // 2. Lire le token stocké
  const token = getStoredToken()

  if (!token) {
    redirectToSso()
    return { status: 'unauthorized' }
  }

  // 3. Vérification locale de l'expiry (évite un appel réseau inutile)
  if (isTokenExpiredLocally(token)) {
    clearToken()
    redirectToSso()
    return { status: 'unauthorized' }
  }

  // 4. Vérification auprès du SaaS
  const access = await verifyTokenWithSaas(token)

  // Erreur réseau : on fait confiance au token local (non expiré) pour éviter la boucle
  if (access === 'network_error') {
    const payload = decodeTokenPayload(token)
    return {
      status: 'authorized',
      accessType: payload?.accessType || 'unknown',
      email: payload?.email || '',
      trialExpiresAt: payload?.trialExpiresAt || null,
    }
  }

  if (!access || !access.hasAccess) {
    clearToken()
    redirectToSso()
    return { status: 'unauthorized' }
  }

  return {
    status: 'authorized',
    accessType: access.accessType,
    email: access.email,
    trialExpiresAt: access.trialExpiresAt,
  }
}

/** Redirige vers le SaaS pour authentification */
export function redirectToSso() {
  window.location.href = getSsoLoginUrl()
}
