import React, { useState } from 'react'
import { X, Download, SkipForward, Layers } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function ExportModal({ onClose, onExport, onExportAndNext, onBatchExport, hasNextImage, totalImages, imageName }) {
  const { t } = useLanguage()
  const [selectedQuality, setSelectedQuality] = useState('MQ')
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [exportMode, setExportMode] = useState('single')

  const qualityOptions = [
    { id: 'HQ', label: t.export.hq.label, description: t.export.hq.desc, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { id: 'MQ', label: t.export.mq.label, description: t.export.mq.desc, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'BQ', label: t.export.bq.label, description: t.export.bq.desc, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ]

  const handleExport = () => {
    if (exportMode === 'batch' && totalImages > 1) {
      onBatchExport(selectedQuality)
    } else if (autoAdvance && hasNextImage) {
      onExportAndNext(selectedQuality)
    } else {
      onExport(selectedQuality)
    }
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      handleExport()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-gray-750 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cyan-400">{t.export.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cyan-500/10 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
          >
            <X size={20} />
          </button>
        </div>

        {imageName && (
          <p className="text-sm text-gray-400 mb-4 truncate">
            {t.export.file} <span className="text-gray-300">{imageName}</span>
          </p>
        )}

        {/* Mode d'export */}
        {totalImages > 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">{t.export.mode}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setExportMode('single')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                  exportMode === 'single'
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-glow'
                    : 'border-gray-600/50 hover:border-cyan-500/50 bg-gray-700/30'
                }`}
              >
                <Download size={20} className={`mx-auto mb-1 ${exportMode === 'single' ? 'text-cyan-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${exportMode === 'single' ? 'text-cyan-400' : 'text-gray-300'}`}>
                  {t.export.currentImage}
                </span>
              </button>
              <button
                onClick={() => setExportMode('batch')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                  exportMode === 'batch'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600/50 hover:border-purple-500/50 bg-gray-700/30'
                }`}
              >
                <Layers size={20} className={`mx-auto mb-1 ${exportMode === 'batch' ? 'text-purple-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${exportMode === 'batch' ? 'text-purple-400' : 'text-gray-300'}`}>
                  {t.export.allImages} ({totalImages})
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Qualité */}
        <p className="text-sm text-gray-400 mb-2">{t.export.quality}</p>
        <div className="space-y-3 mb-6">
          {qualityOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedQuality(option.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedQuality === option.id
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-glow'
                  : 'border-gray-600/50 hover:border-cyan-500/30 bg-gray-700/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-100">{option.label}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-lg border ${option.color}`}>
                    {option.id}
                  </span>
                </div>
                {selectedQuality === option.id && (
                  <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center shadow-glow">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Options supplémentaires */}
        {exportMode === 'single' && hasNextImage && (
          <label className="flex items-center gap-3 mb-6 cursor-pointer group">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-800"
            />
            <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
              {t.export.autoAdvance}
            </span>
          </label>
        )}

        {/* Info export par lot */}
        {exportMode === 'batch' && (
          <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-sm text-purple-300">
              {t.export.batchInfo.replace('{{n}}', totalImages)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-xl font-medium transition-all"
          >
            {t.export.cancel}
          </button>
          <button
            onClick={handleExport}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              exportMode === 'batch'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-glow hover:shadow-glow-lg'
            }`}
          >
            {exportMode === 'batch' ? (
              <>
                <Layers size={18} />
                {t.export.exportAll}
              </>
            ) : autoAdvance && hasNextImage ? (
              <>
                <SkipForward size={18} />
                {t.export.exportAndNext}
              </>
            ) : (
              <>
                <Download size={18} />
                {t.export.export}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
