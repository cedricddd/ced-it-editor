import React from 'react'
import { Sun, Contrast, Droplets, Focus, RotateCcw } from 'lucide-react'

const adjustmentControls = [
  { key: 'brightness', label: 'Luminosité', icon: Sun, min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', icon: Contrast, min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', icon: Droplets, min: -100, max: 100 },
  { key: 'sharpness', label: 'Netteté', icon: Focus, min: 0, max: 100 },
]

function AdjustmentsPanel({ adjustments, setAdjustments, disabled }) {
  const handleChange = (key, value) => {
    setAdjustments(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0
    })
  }

  return (
    <aside className="w-64 bg-gray-750 border-l border-cyan-500/20 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-cyan-400">Réglages</h2>
        <button
          onClick={handleReset}
          disabled={disabled}
          className="p-1.5 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
          title="Réinitialiser"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="space-y-6">
        {adjustmentControls.map((control) => {
          const Icon = control.icon
          return (
            <div key={control.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <Icon size={16} className="text-cyan-400" />
                  {control.label}
                </label>
                <span className="text-xs text-cyan-400 w-10 text-right font-mono">
                  {adjustments[control.key]}
                </span>
              </div>
              <input
                type="range"
                min={control.min}
                max={control.max}
                value={adjustments[control.key]}
                onChange={(e) => handleChange(control.key, parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-cyan-500"
              />
            </div>
          )
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-cyan-500/20">
        <h3 className="text-sm font-medium text-cyan-400 mb-3">Raccourcis clavier</h3>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Sélection', key: '1' },
            { label: 'Texte', key: '2' },
            { label: 'Rectangle', key: '3' },
            { label: 'Cercle', key: '4' },
            { label: 'Flèche', key: '5' },
            { label: 'Surlignage', key: '6' },
            { label: 'Dessin', key: '7' },
            { label: 'Gomme', key: '8' },
            { label: 'Recadrage', key: '9' },
            { label: 'Exporter', key: 'Ctrl+S' },
            { label: 'Image suivante', key: '→' },
            { label: 'Image précédente', key: '←' },
          ].map((shortcut) => (
            <div key={shortcut.label} className="flex justify-between text-gray-400">
              <span>{shortcut.label}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-700/50 border border-cyan-500/20 rounded text-cyan-400/80 font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default AdjustmentsPanel
