import React, { useState, useCallback, useEffect } from 'react'
import Toolbar from './components/Toolbar'
import ImageCanvas from './components/ImageCanvas'
import ImageQueue from './components/ImageQueue'
import AdjustmentsPanel from './components/AdjustmentsPanel'
import ExportModal from './components/ExportModal'
import ToolSettings from './components/ToolSettings'

function App() {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeTool, setActiveTool] = useState('select')
  const [showExportModal, setShowExportModal] = useState(false)
  const [canvasRef, setCanvasRef] = useState(null)
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0
  })
  const [toolSettings, setToolSettings] = useState({
    color: '#00d4ff',
    strokeWidth: 3,
    fontSize: 24
  })

  const currentImage = images[currentIndex] || null

  // Sauvegarder les annotations de l'image actuelle dans le state
  const saveCurrentAnnotations = useCallback(() => {
    if (canvasRef && currentImage) {
      const objects = canvasRef.getObjects().filter(obj => obj.name !== 'backgroundImage')
      const annotations = objects.length > 0 ? canvasRef.toJSON(['name']) : null

      setImages(prev => prev.map(img =>
        img.id === currentImage.id
          ? { ...img, annotations }
          : img
      ))
    }
  }, [canvasRef, currentImage])

  const handleImportImages = useCallback((files) => {
    const newImages = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      url: URL.createObjectURL(file),
      name: file.name || `capture_${Date.now() + index}.png`,
      annotations: null
    }))
    setImages(prev => [...prev, ...newImages])
    if (images.length === 0) {
      setCurrentIndex(0)
    }
  }, [images.length])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    )
    if (files.length > 0) {
      handleImportImages(files)
    }
  }, [handleImportImages])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleChangeImage = useCallback((newIndex) => {
    // Sauvegarder les annotations de l'image actuelle avant de changer
    saveCurrentAnnotations()
    setCurrentIndex(newIndex)
  }, [saveCurrentAnnotations])

  const handleNextImage = useCallback(() => {
    if (currentIndex < images.length - 1) {
      handleChangeImage(currentIndex + 1)
    }
  }, [currentIndex, images.length, handleChangeImage])

  const handlePrevImage = useCallback(() => {
    if (currentIndex > 0) {
      handleChangeImage(currentIndex - 1)
    }
  }, [currentIndex, handleChangeImage])

  const handleRemoveImage = useCallback((index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      if (currentIndex >= newImages.length && newImages.length > 0) {
        setCurrentIndex(newImages.length - 1)
      }
      return newImages
    })
  }, [currentIndex, images])

  const handleExport = useCallback((quality, imageIndex = currentIndex) => {
    if (!canvasRef) return null

    const qualityMap = { HQ: 1.0, MQ: 0.7, BQ: 0.4 }
    const imageName = images[imageIndex]?.name || 'image'
    const multiplier = quality === 'HQ' ? 2 : quality === 'MQ' ? 1 : 0.5

    // Trouver l'image de fond pour exporter seulement cette zone
    const bgImage = canvasRef.getObjects().find(obj => obj.name === 'backgroundImage')

    let dataUrl
    if (bgImage) {
      // Exporter seulement la zone de l'image de fond (sans le fond du canvas)
      const left = bgImage.left
      const top = bgImage.top
      const width = bgImage.width * bgImage.scaleX
      const height = bgImage.height * bgImage.scaleY

      dataUrl = canvasRef.toDataURL({
        format: 'png',
        quality: qualityMap[quality],
        multiplier: multiplier,
        left: left,
        top: top,
        width: width,
        height: height
      })
    } else {
      // Fallback: exporter tout le canvas
      dataUrl = canvasRef.toDataURL({
        format: 'png',
        quality: qualityMap[quality],
        multiplier: multiplier
      })
    }

    const link = document.createElement('a')
    link.download = `${imageName.replace(/\.[^/.]+$/, '')}_${quality}.png`
    link.href = dataUrl
    link.click()

    return dataUrl
  }, [canvasRef, images, currentIndex])

  const handleExportAndNext = useCallback((quality) => {
    handleExport(quality)
    setTimeout(() => {
      handleNextImage()
    }, 300)
  }, [handleExport, handleNextImage])

  const handleBatchExport = useCallback(async (quality) => {
    if (!canvasRef || images.length === 0) return

    // Sauvegarder les annotations de l'image actuelle avant de commencer
    saveCurrentAnnotations()

    const totalImages = images.length
    let exportIndex = 0

    const exportAndNext = () => {
      // Changer vers l'image à exporter SANS sauvegarder
      // (pour ne pas écraser les annotations des autres images)
      setCurrentIndex(exportIndex)

      // Attendre que l'image charge, puis exporter
      setTimeout(() => {
        handleExport(quality)
        exportIndex++

        // S'il reste des images, continuer
        if (exportIndex < totalImages) {
          setTimeout(exportAndNext, 300)
        }
      }, 600)
    }

    // Démarrer l'export depuis la première image
    exportAndNext()
  }, [canvasRef, images.length, handleExport, saveCurrentAnnotations])

  // Supprimer les objets sélectionnés sur le canvas
  const handleDeleteSelected = useCallback(() => {
    if (!canvasRef) return

    const activeObjects = canvasRef.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        if (obj.name !== 'backgroundImage' && obj.name !== 'cropRect') {
          canvasRef.remove(obj)
        }
      })
      canvasRef.discardActiveObject()
      canvasRef.renderAll()
    }
  }, [canvasRef])

  // Vérifier si le partage est disponible
  const canShare = typeof navigator !== 'undefined' && navigator.share && navigator.canShare

  // Partager l'image actuelle
  const handleShare = useCallback(async () => {
    if (!canvasRef || !currentImage) return

    try {
      // Trouver l'image de fond pour exporter seulement cette zone
      const bgImage = canvasRef.getObjects().find(obj => obj.name === 'backgroundImage')
      let dataUrl
      if (bgImage) {
        const left = bgImage.left
        const top = bgImage.top
        const width = bgImage.width * bgImage.scaleX
        const height = bgImage.height * bgImage.scaleY
        dataUrl = canvasRef.toDataURL({
          format: 'png',
          quality: 1,
          left: left,
          top: top,
          width: width,
          height: height
        })
      } else {
        dataUrl = canvasRef.toDataURL({ format: 'png', quality: 1 })
      }
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `${currentImage.name || 'image'}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ced-IT Editor',
          text: 'Image éditée avec Ced-IT Editor'
        })
      } else {
        // Fallback: télécharger l'image
        const link = document.createElement('a')
        link.download = `${currentImage.name || 'image'}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur de partage:', err)
      }
    }
  }, [canvasRef, currentImage])

  // Partager toutes les images
  const handleShareAll = useCallback(async () => {
    if (!canvasRef || images.length === 0) return

    try {
      const files = []

      // Trouver l'image de fond pour exporter seulement cette zone
      const bgImage = canvasRef.getObjects().find(obj => obj.name === 'backgroundImage')
      let currentDataUrl
      if (bgImage) {
        const left = bgImage.left
        const top = bgImage.top
        const width = bgImage.width * bgImage.scaleX
        const height = bgImage.height * bgImage.scaleY
        currentDataUrl = canvasRef.toDataURL({
          format: 'png',
          quality: 1,
          left: left,
          top: top,
          width: width,
          height: height
        })
      } else {
        currentDataUrl = canvasRef.toDataURL({ format: 'png', quality: 1 })
      }
      const currentResponse = await fetch(currentDataUrl)
      const currentBlob = await currentResponse.blob()
      files.push(new File([currentBlob], `${currentImage?.name || 'image'}.png`, { type: 'image/png' }))

      // Ajouter les autres images de la file (images originales sans annotations du canvas)
      for (let i = 0; i < images.length; i++) {
        if (i !== currentIndex) {
          const img = images[i]
          const response = await fetch(img.url)
          const blob = await response.blob()
          files.push(new File([blob], `${img.name || `image_${i}`}.png`, { type: 'image/png' }))
        }
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: 'Ced-IT Editor',
          text: `${files.length} images éditées avec Ced-IT Editor`
        })
      } else {
        // Fallback: télécharger chaque image
        files.forEach((file, index) => {
          const url = URL.createObjectURL(file)
          const link = document.createElement('a')
          link.download = file.name
          link.href = url
          setTimeout(() => link.click(), index * 200)
        })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur de partage multiple:', err)
      }
    }
  }, [canvasRef, images, currentIndex, currentImage])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch(e.key.toLowerCase()) {
        case 's':
          if (e.ctrlKey) {
            e.preventDefault()
            setShowExportModal(true)
          }
          break
        case 'arrowright':
          handleNextImage()
          break
        case 'arrowleft':
          handlePrevImage()
          break
        case 'delete':
          // Suppr = supprimer la sélection sur le canvas
          handleDeleteSelected()
          break
        case '1':
          setActiveTool('select')
          break
        case '2':
          setActiveTool('text')
          break
        case '3':
          setActiveTool('rectangle')
          break
        case '4':
          setActiveTool('circle')
          break
        case '5':
          setActiveTool('arrow')
          break
        case '6':
          setActiveTool('highlight')
          break
        case '7':
          setActiveTool('blur')
          break
        case '8':
          setActiveTool('draw')
          break
        case '9':
          setActiveTool('crop')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasRef, handleNextImage, handlePrevImage, handleDeleteSelected, currentIndex, currentImage])

  return (
    <div
      className="h-screen flex flex-col bg-gray-800"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header - Ced-IT Style */}
      <header className="bg-gray-750 border-b border-cyan-500/20 px-2 md:px-4 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <img src="/logo.png" alt="Ced-IT" className="h-12 md:h-14 w-auto" />
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-cyan-400 leading-tight">Ced-IT</h1>
            <span className="text-xs text-gray-400">Image Editor</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-gray-400 text-xs md:text-sm">
            {images.length > 0 ? `${currentIndex + 1}/${images.length}` : ''}
          </span>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={!currentImage}
            className="px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full text-xs md:text-sm font-medium transition-all shadow-glow hover:shadow-glow-lg"
          >
            <span className="hidden md:inline">Exporter</span>
            <span className="md:hidden">Export</span>
          </button>
          {/* Mobile panel toggle */}
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="md:hidden p-2 bg-gray-700 rounded-lg text-cyan-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tool Settings Bar */}
      <ToolSettings
        toolSettings={toolSettings}
        setToolSettings={setToolSettings}
        activeTool={activeTool}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Toolbar */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onImport={handleImportImages}
          onDeleteSelected={handleDeleteSelected}
          onShare={handleShare}
          onShareAll={handleShareAll}
          canShare={canShare}
          hasMultipleImages={images.length > 1}
        />

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {currentImage ? (
            <ImageCanvas
              image={currentImage}
              activeTool={activeTool}
              adjustments={adjustments}
              toolSettings={toolSettings}
              onCanvasReady={setCanvasRef}
              savedAnnotations={currentImage.annotations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-800 p-4">
              <div className="text-center p-6 md:p-10 border-2 border-dashed border-cyan-500/30 rounded-xl bg-gray-750/50 max-w-md">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-300 text-base md:text-lg mb-2 font-medium">
                  Glissez-déposez des images
                </p>
                <p className="text-gray-500 text-xs md:text-sm mb-4">
                  Ou utilisez les boutons de la barre d'outils
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-cyan-500/10 rounded">📁 Import</span>
                  <span className="px-2 py-1 bg-green-500/10 rounded">📷 Caméra</span>
                  <span className="px-2 py-1 bg-purple-500/10 rounded">🖥️ Capture</span>
                </div>
              </div>
            </div>
          )}

          {/* Image Queue */}
          {images.length > 0 && (
            <ImageQueue
              images={images}
              currentIndex={currentIndex}
              onSelect={handleChangeImage}
              onRemove={handleRemoveImage}
            />
          )}
        </main>

        {/* Adjustments Panel - Desktop */}
        <div className="hidden md:block">
          <AdjustmentsPanel
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            disabled={!currentImage}
          />
        </div>

        {/* Mobile Panel Overlay */}
        {showMobilePanel && (
          <div className="md:hidden absolute inset-0 bg-black/50 z-40" onClick={() => setShowMobilePanel(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gray-750" onClick={e => e.stopPropagation()}>
              <AdjustmentsPanel
                adjustments={adjustments}
                setAdjustments={setAdjustments}
                disabled={!currentImage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          onExportAndNext={handleExportAndNext}
          onBatchExport={handleBatchExport}
          hasNextImage={currentIndex < images.length - 1}
          totalImages={images.length}
          imageName={currentImage?.name}
        />
      )}
    </div>
  )
}

export default App
