import React from 'react'
import { Palette, Minus, Type } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

const presetColors = [
  '#00d4ff', // Cyan (Ced-IT accent)
  '#ff0000', // Rouge
  '#ff6b00', // Orange
  '#ffff00', // Jaune
  '#00ff00', // Vert
  '#0066ff', // Bleu
  '#9900ff', // Violet
  '#ff00ff', // Magenta
  '#ffffff', // Blanc
  '#000000', // Noir
]

const strokeWidths = [1, 2, 3, 5, 8, 12]
const fontSizes = [12, 16, 20, 24, 32, 48, 64]

function ToolSettings({ toolSettings, setToolSettings, activeTool }) {
  const { t } = useLanguage()
  const showStrokeWidth = ['rectangle', 'circle', 'arrow', 'draw', 'highlight'].includes(activeTool)
  const showFontSize = activeTool === 'text'
  const showColor = ['rectangle', 'circle', 'arrow', 'draw', 'highlight', 'text'].includes(activeTool)

  if (!showColor && !showStrokeWidth && !showFontSize) {
    return null
  }

  return (
    <div className="bg-gray-750 border-b border-cyan-500/20 px-4 py-2 flex items-center gap-6 flex-wrap">
      {/* Couleur */}
      {showColor && (
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-cyan-400" />
          <span className="text-sm text-gray-400">{t.toolSettings.color}</span>
          <div className="flex items-center gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setToolSettings(prev => ({ ...prev, color }))}
                className={`w-6 h-6 rounded-lg border-2 transition-all ${
                  toolSettings.color === color
                    ? 'border-cyan-400 scale-110 shadow-glow'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <input
              type="color"
              value={toolSettings.color}
              onChange={(e) => setToolSettings(prev => ({ ...prev, color: e.target.value }))}
              className="w-6 h-6 rounded-lg cursor-pointer border border-gray-600"
              title={t.toolSettings.customColor}
            />
          </div>
        </div>
      )}

      {/* Épaisseur du trait */}
      {showStrokeWidth && (
        <div className="flex items-center gap-2">
          <Minus size={16} className="text-cyan-400" />
          <span className="text-sm text-gray-400">{t.toolSettings.strokeWidth}</span>
          <div className="flex items-center gap-1">
            {strokeWidths.map((width) => (
              <button
                key={width}
                onClick={() => setToolSettings(prev => ({ ...prev, strokeWidth: width }))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  toolSettings.strokeWidth === width
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-transparent'
                }`}
                title={`${width}px`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.min(width + 2, 20), height: Math.min(width + 2, 20) }}
                />
              </button>
            ))}
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={toolSettings.strokeWidth}
            onChange={(e) => setToolSettings(prev => ({ ...prev, strokeWidth: parseInt(e.target.value) }))}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="text-xs text-cyan-400 w-8">{toolSettings.strokeWidth}px</span>
        </div>
      )}

      {/* Taille du texte */}
      {showFontSize && (
        <div className="flex items-center gap-2">
          <Type size={16} className="text-cyan-400" />
          <span className="text-sm text-gray-400">{t.toolSettings.fontSize}</span>
          <div className="flex items-center gap-1">
            {fontSizes.map((size) => (
              <button
                key={size}
                onClick={() => setToolSettings(prev => ({ ...prev, fontSize: size }))}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${
                  toolSettings.fontSize === size
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-transparent'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="8"
            max="200"
            value={toolSettings.fontSize}
            onChange={(e) => setToolSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 24 }))}
            className="w-16 px-2 py-1 bg-gray-700/50 border border-cyan-500/30 rounded-lg text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

export default ToolSettings
