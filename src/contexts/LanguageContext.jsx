import { createContext, useContext, useState, useEffect } from 'react'
import { fr } from '../locales/fr'
import { en } from '../locales/en'
import { nl } from '../locales/nl'
import { de } from '../locales/de'
import { es } from '../locales/es'
import { hi } from '../locales/hi'

const translations = { fr, en, nl, de, es, hi }

const LanguageContext = createContext({
  locale: 'fr',
  setLocale: () => {},
  t: fr,
})

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('fr')

  useEffect(() => {
    const saved = localStorage.getItem('ced-locale')
    if (saved && translations[saved]) {
      setLocaleState(saved)
    }
  }, [])

  function setLocale(newLocale) {
    setLocaleState(newLocale)
    localStorage.setItem('ced-locale', newLocale)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
