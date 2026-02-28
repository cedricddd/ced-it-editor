import React from 'react'
import { Sun, Contrast, Droplets, Focus, RotateCcw } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function AdjustmentsPanel({ adjustments, setAdjustments, disabled }) {
  const { t } = useLanguage()

  const adjustmentControls = [
    { key: 'brightness', label: t.adjustments.brightness, icon: Sun,      min: -100, max: 100 },
    { key: 'contrast',   label: t.adjustments.contrast,   icon: Contrast, min: -100, max: 100 },
    { key: 'saturation', label: t.adjustments.saturation, icon: Droplets, min: -100, max: 100 },
    { key: 'sharpness',  label: t.adjustments.sharpness,  icon: Focus,    min: 0,    max: 100 },
  ]

  const shortcutList = [
    { label: t.adjustments.shortcutLabels.select,    key: '1' },
    { label: t.adjustments.shortcutLabels.text,      key: '2' },
    { label: t.adjustments.shortcutLabels.rectangle, key: '3' },
    { label: t.adjustments.shortcutLabels.circle,    key: '4' },
    { label: t.adjustments.shortcutLabels.arrow,     key: '5' },
    { label: t.adjustments.shortcutLabels.highlight, key: '6' },
    { label: t.adjustments.shortcutLabels.draw,      key: '7' },
    { label: t.adjustments.shortcutLabels.eraser,    key: '8' },
    { label: t.adjustments.shortcutLabels.crop,      key: '9' },
    { label: t.adjustments.shortcutLabels.export,    key: 'Ctrl+S' },
    { label: t.adjustments.shortcutLabels.nextImage, key: '→' },
    { label: t.adjustments.shortcutLabels.prevImage, key: '←' },
  ]

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
        <h2 className="text-lg font-semibold text-cyan-400">{t.adjustments.title}</h2>
        <button
          onClick={handleReset}
          disabled={disabled}
          className="p-1.5 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
          title={t.adjustments.reset}
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
        <h3 className="text-sm font-medium text-cyan-400 mb-3">{t.adjustments.shortcuts}</h3>
        <div className="space-y-1.5 text-xs">
          {shortcutList.map((shortcut) => (
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
