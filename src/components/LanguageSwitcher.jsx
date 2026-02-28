import { useState, useRef, useEffect } from 'react'
import { Globe2, Check } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

const languages = [
  { code: 'fr', label: 'Français',   flag: '🇫🇷', nativeName: 'FR' },
  { code: 'en', label: 'English',    flag: '🇬🇧', nativeName: 'EN' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', nativeName: 'NL' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', nativeName: 'DE' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', nativeName: 'ES' },
  { code: 'hi', label: 'हिन्दी',      flag: '🇮🇳', nativeName: 'HI' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find(l => l.code === locale) ?? languages[0]

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
          open
            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
            : 'border-cyan-500/20 bg-gray-700/50 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400'
        }`}
      >
        <Globe2 size={14} className="text-violet-400 flex-shrink-0" />
        <span className="text-base leading-none select-none">{current.flag}</span>
        <span className="hidden sm:inline tracking-wider font-bold">{current.nativeName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-cyan-500/20 bg-gray-800 shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-cyan-500/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Langue / Language
            </p>
          </div>
          <div className="py-1">
            {languages.map(lang => {
              const isActive = locale === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { setLocale(lang.code); setOpen(false) }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg leading-none w-6 text-center select-none flex-shrink-0">{lang.flag}</span>
                  <span className={`flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium'}`}>{lang.label}</span>
                  {isActive && <Check size={12} className="text-cyan-400 flex-shrink-0" strokeWidth={2.5} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
