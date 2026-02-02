import React, { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { Check, X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react'

function ImageCanvas({ image, activeTool, adjustments, toolSettings, onCanvasReady, savedAnnotations, onAnnotationsChange, imageId }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvas, setCanvas] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [currentShape, setCurrentShape] = useState(null)
  const [cropRect, setCropRect] = useState(null)
  const [isCropping, setIsCropping] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const imageIdRef = useRef(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const lastTouchDistance = useRef(null)
  const lastPanPoint = useRef(null)

  // Sauvegarder les annotations après chaque modification
  const saveAnnotations = useCallback(() => {
    if (canvas && onAnnotationsChange && imageId) {
      const objects = canvas.getObjects().filter(obj => obj.name !== 'backgroundImage' && obj.name !== 'cropRect')
      const annotations = objects.length > 0 ? canvas.toJSON(['name']) : null
      onAnnotationsChange(annotations, imageId)
    }
  }, [canvas, onAnnotationsChange, imageId])

  // Initialiser le canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#0a1628',
      selection: true,
    })

    setCanvas(fabricCanvas)
    onCanvasReady(fabricCanvas)

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        fabricCanvas.setDimensions({ width: width - 10, height: height - 10 })
        fabricCanvas.renderAll()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      fabricCanvas.dispose()
    }
  }, [])

  // Ref pour stocker les annotations à restaurer (mise à jour seulement au changement d'image)
  const annotationsToRestoreRef = useRef(null)

  // Charger l'image et restaurer les annotations
  useEffect(() => {
    if (!canvas || !image) return

    const currentImageId = image.id
    imageIdRef.current = currentImageId

    // Capturer les annotations au moment du changement d'image
    // (on utilise savedAnnotations de la prop, pas une ref qui pourrait être périmée)
    annotationsToRestoreRef.current = savedAnnotations
    const annotationsToRestore = savedAnnotations

    fabric.Image.fromURL(image.url, (img) => {
      // Vérifier que c'est toujours la bonne image (éviter les race conditions)
      if (imageIdRef.current !== currentImageId) return

      canvas.clear()
      canvas.setBackgroundColor('#0a1628', canvas.renderAll.bind(canvas))

      const containerWidth = canvas.width
      const containerHeight = canvas.height
      const scale = Math.min(
        (containerWidth - 40) / img.width,
        (containerHeight - 40) / img.height,
        1
      )

      img.scale(scale)
      img.set({
        left: (containerWidth - img.width * scale) / 2,
        top: (containerHeight - img.height * scale) / 2,
        selectable: false,
        evented: false,
        name: 'backgroundImage'
      })

      canvas.add(img)
      canvas.sendToBack(img)
      setBackgroundImage(img)
      setCropRect(null)
      setIsCropping(false)

      // Restaurer les annotations APRÈS avoir chargé l'image de fond
      if (annotationsToRestore?.objects) {
        const annotations = annotationsToRestore.objects.filter(obj => obj.name !== 'backgroundImage')
        if (annotations.length > 0) {
          fabric.util.enlivenObjects(annotations, (objects) => {
            // Vérifier qu'on est toujours sur la bonne image
            if (imageIdRef.current !== currentImageId) return
            objects.forEach(obj => {
              canvas.add(obj)
            })
            canvas.renderAll()
          })
        }
      }

      canvas.renderAll()
    }, { crossOrigin: 'anonymous' })
  }, [canvas, image?.id, image?.url])


  // Appliquer les ajustements
  useEffect(() => {
    if (!canvas) return

    const bgImage = canvas.getObjects().find(obj => obj.name === 'backgroundImage')
    if (!bgImage) return

    const filters = []

    if (adjustments.brightness !== 0) {
      filters.push(new fabric.Image.filters.Brightness({
        brightness: adjustments.brightness / 100
      }))
    }

    if (adjustments.contrast !== 0) {
      filters.push(new fabric.Image.filters.Contrast({
        contrast: adjustments.contrast / 100
      }))
    }

    if (adjustments.saturation !== 0) {
      filters.push(new fabric.Image.filters.Saturation({
        saturation: adjustments.saturation / 100
      }))
    }

    bgImage.filters = filters
    bgImage.applyFilters()
    canvas.renderAll()
  }, [canvas, adjustments])

  // Appliquer le recadrage
  const applyCrop = useCallback(() => {
    if (!canvas || !cropRect || !backgroundImage) return

    const rect = cropRect
    const img = backgroundImage

    const imgLeft = img.left
    const imgTop = img.top
    const imgScale = img.scaleX

    const cropX = (rect.left - imgLeft) / imgScale
    const cropY = (rect.top - imgTop) / imgScale
    const cropWidth = (rect.width * rect.scaleX) / imgScale
    const cropHeight = (rect.height * rect.scaleY) / imgScale

    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = cropWidth
    croppedCanvas.height = cropHeight
    const ctx = croppedCanvas.getContext('2d')

    const originalImg = new Image()
    originalImg.crossOrigin = 'anonymous'
    originalImg.onload = () => {
      ctx.drawImage(
        originalImg,
        Math.max(0, cropX), Math.max(0, cropY), cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      )

      const croppedDataUrl = croppedCanvas.toDataURL('image/png')

      fabric.Image.fromURL(croppedDataUrl, (newImg) => {
        canvas.remove(cropRect)
        canvas.remove(img)

        const containerWidth = canvas.width
        const containerHeight = canvas.height
        const scale = Math.min(
          (containerWidth - 40) / newImg.width,
          (containerHeight - 40) / newImg.height,
          1
        )

        newImg.scale(scale)
        newImg.set({
          left: (containerWidth - newImg.width * scale) / 2,
          top: (containerHeight - newImg.height * scale) / 2,
          selectable: false,
          evented: false,
          name: 'backgroundImage'
        })

        canvas.add(newImg)
        canvas.sendToBack(newImg)
        setBackgroundImage(newImg)
        setCropRect(null)
        setIsCropping(false)
        canvas.renderAll()
      })
    }
    originalImg.src = image.url
  }, [canvas, cropRect, backgroundImage, image])

  const cancelCrop = useCallback(() => {
    if (canvas && cropRect) {
      canvas.remove(cropRect)
      setCropRect(null)
      setIsCropping(false)
      canvas.renderAll()
    }
  }, [canvas, cropRect])

  // Gérer les outils de dessin
  useEffect(() => {
    if (!canvas) return

    const color = toolSettings?.color || '#00d4ff'
    const strokeWidth = toolSettings?.strokeWidth || 3
    const fontSize = toolSettings?.fontSize || 24

    canvas.isDrawingMode = activeTool === 'draw'
    canvas.selection = activeTool === 'select'

    // Désactiver le touch-action sur le canvas quand un outil de dessin est actif
    const upperCanvas = canvas.upperCanvasEl
    if (upperCanvas) {
      if (['rectangle', 'circle', 'arrow', 'highlight', 'blur', 'crop', 'draw'].includes(activeTool)) {
        upperCanvas.style.touchAction = 'none'
      } else {
        upperCanvas.style.touchAction = 'manipulation'
      }
    }

    if (activeTool === 'draw') {
      canvas.freeDrawingBrush.width = strokeWidth
      canvas.freeDrawingBrush.color = color
    }

    canvas.off('mouse:down')
    canvas.off('mouse:move')
    canvas.off('mouse:up')

    // Outil de recadrage
    if (activeTool === 'crop') {
      canvas.on('mouse:down', (opt) => {
        if (opt.target && opt.target.name !== 'backgroundImage') return
        setIsDrawing(true)
        const pointer = canvas.getPointer(opt.e)
        setStartPoint({ x: pointer.x, y: pointer.y })

        if (cropRect) {
          canvas.remove(cropRect)
        }

        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(0, 212, 255, 0.2)',
          stroke: '#00d4ff',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          hasControls: true,
          name: 'cropRect'
        })

        canvas.add(rect)
        setCropRect(rect)
        setCurrentShape(rect)
      })

      canvas.on('mouse:move', (opt) => {
        if (!isDrawing || !currentShape || !startPoint) return

        const pointer = canvas.getPointer(opt.e)
        const width = Math.abs(pointer.x - startPoint.x)
        const height = Math.abs(pointer.y - startPoint.y)

        currentShape.set({
          width,
          height,
          left: Math.min(pointer.x, startPoint.x),
          top: Math.min(pointer.y, startPoint.y),
        })

        canvas.renderAll()
      })

      canvas.on('mouse:up', () => {
        setIsDrawing(false)
        setCurrentShape(null)
        setStartPoint(null)
        if (cropRect && cropRect.width > 10 && cropRect.height > 10) {
          setIsCropping(true)
          canvas.setActiveObject(cropRect)
        }
      })
    }

    // Outil de masquage (blur)
    if (activeTool === 'blur') {
      canvas.on('mouse:down', (opt) => {
        if (opt.target) return
        setIsDrawing(true)
        const pointer = canvas.getPointer(opt.e)
        setStartPoint({ x: pointer.x, y: pointer.y })

        const blurRect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: '#1a1a2e',
          stroke: '#333',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
          name: 'blurMask'
        })

        canvas.add(blurRect)
        setCurrentShape(blurRect)
      })

      canvas.on('mouse:move', (opt) => {
        if (!isDrawing || !currentShape || !startPoint) return

        const pointer = canvas.getPointer(opt.e)
        const width = Math.abs(pointer.x - startPoint.x)
        const height = Math.abs(pointer.y - startPoint.y)

        currentShape.set({
          width,
          height,
          left: Math.min(pointer.x, startPoint.x),
          top: Math.min(pointer.y, startPoint.y),
        })

        canvas.renderAll()
      })

      canvas.on('mouse:up', () => {
        setIsDrawing(false)
        setCurrentShape(null)
        setStartPoint(null)
        canvas.renderAll()
        saveAnnotations()
      })
    }

    if (['rectangle', 'circle', 'arrow', 'highlight'].includes(activeTool)) {
      canvas.on('mouse:down', (opt) => {
        if (opt.target) return
        setIsDrawing(true)
        const pointer = canvas.getPointer(opt.e)
        setStartPoint({ x: pointer.x, y: pointer.y })

        let shape = null
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 212, b: 255 }
        }

        const rgb = hexToRgb(color)

        const commonProps = {
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          strokeWidth: strokeWidth,
          stroke: activeTool === 'highlight' ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` : color,
          fill: activeTool === 'highlight' ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` : 'transparent',
        }

        if (activeTool === 'rectangle' || activeTool === 'highlight') {
          shape = new fabric.Rect({
            ...commonProps,
            width: 0,
            height: 0,
          })
        } else if (activeTool === 'circle') {
          shape = new fabric.Ellipse({
            ...commonProps,
            rx: 0,
            ry: 0,
          })
        } else if (activeTool === 'arrow') {
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: color,
            strokeWidth: strokeWidth,
          })
        }

        if (shape) {
          canvas.add(shape)
          setCurrentShape(shape)
        }
      })

      canvas.on('mouse:move', (opt) => {
        if (!isDrawing || !currentShape || !startPoint) return

        const pointer = canvas.getPointer(opt.e)

        if (activeTool === 'rectangle' || activeTool === 'highlight') {
          const width = Math.abs(pointer.x - startPoint.x)
          const height = Math.abs(pointer.y - startPoint.y)
          currentShape.set({
            width,
            height,
            left: Math.min(pointer.x, startPoint.x),
            top: Math.min(pointer.y, startPoint.y),
          })
        } else if (activeTool === 'circle') {
          const rx = Math.abs(pointer.x - startPoint.x) / 2
          const ry = Math.abs(pointer.y - startPoint.y) / 2
          currentShape.set({
            rx,
            ry,
            left: Math.min(pointer.x, startPoint.x),
            top: Math.min(pointer.y, startPoint.y),
          })
        } else if (activeTool === 'arrow') {
          currentShape.set({
            x2: pointer.x,
            y2: pointer.y,
          })
        }

        canvas.renderAll()
      })

      canvas.on('mouse:up', () => {
        if (activeTool === 'arrow' && currentShape) {
          const x1 = currentShape.x1
          const y1 = currentShape.y1
          const x2 = currentShape.x2
          const y2 = currentShape.y2

          const angle = Math.atan2(y2 - y1, x2 - x1)
          const headLength = strokeWidth * 4

          const arrowHead = new fabric.Triangle({
            left: x2,
            top: y2,
            width: headLength,
            height: headLength,
            fill: color,
            angle: (angle * 180 / Math.PI) + 90,
            originX: 'center',
            originY: 'center',
          })

          canvas.add(arrowHead)
        }

        setIsDrawing(false)
        setCurrentShape(null)
        setStartPoint(null)
        canvas.renderAll()
        saveAnnotations()
      })
    }

    if (activeTool === 'text') {
      canvas.on('mouse:down', (opt) => {
        if (opt.target) return
        const pointer = canvas.getPointer(opt.e)
        const text = new fabric.IText('Texte', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: fontSize,
          fill: color,
          editable: true,
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        text.enterEditing()
        // Sélectionner tout le texte pour qu'il soit remplacé à la frappe
        text.selectAll()
        saveAnnotations()
      })
    }

    // Sauvegarder quand un objet est modifié (déplacé, redimensionné, etc.)
    const handleObjectModified = () => saveAnnotations()
    canvas.on('object:modified', handleObjectModified)

    // Sauvegarder après dessin libre
    const handlePathCreated = () => saveAnnotations()
    canvas.on('path:created', handlePathCreated)

    return () => {
      canvas.off('mouse:down')
      canvas.off('mouse:move')
      canvas.off('mouse:up')
      canvas.off('object:modified', handleObjectModified)
      canvas.off('path:created', handlePathCreated)
    }
  }, [canvas, activeTool, isDrawing, currentShape, startPoint, toolSettings, backgroundImage, cropRect, saveAnnotations])

  // Fonctions de zoom
  const handleZoomIn = useCallback(() => {
    if (!canvas) return
    let newZoom = canvas.getZoom() * 1.2
    newZoom = Math.min(newZoom, 5)
    canvas.setZoom(newZoom)
    setZoomLevel(newZoom)
    canvas.renderAll()
  }, [canvas])

  const handleZoomOut = useCallback(() => {
    if (!canvas) return
    let newZoom = canvas.getZoom() / 1.2
    newZoom = Math.max(newZoom, 0.5)
    canvas.setZoom(newZoom)
    setZoomLevel(newZoom)
    canvas.renderAll()
  }, [canvas])

  const handleZoomReset = useCallback(() => {
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    setZoomLevel(1)
    canvas.renderAll()
  }, [canvas])

  const handleCenterView = useCallback(() => {
    if (!canvas) return
    const zoom = canvas.getZoom()
    // Centrer la vue en gardant le zoom actuel
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0])
    canvas.renderAll()
  }, [canvas])

  // Activer le mode pan quand zoomé
  useEffect(() => {
    if (!canvas) return

    let isPanning = false
    let lastPosX = 0
    let lastPosY = 0

    const handleMouseDown = (opt) => {
      // Activer le pan seulement si zoomé et en mode sélection
      if (canvas.getZoom() > 1 && activeTool === 'select') {
        const evt = opt.e
        // Vérifier si on clique sur un objet
        if (!opt.target || opt.target.name === 'backgroundImage') {
          isPanning = true
          canvas.selection = false
          lastPosX = evt.clientX || (evt.touches && evt.touches[0]?.clientX)
          lastPosY = evt.clientY || (evt.touches && evt.touches[0]?.clientY)
          canvas.defaultCursor = 'grabbing'
          canvas.setCursor('grabbing')
        }
      }
    }

    const handleMouseMove = (opt) => {
      if (isPanning) {
        const evt = opt.e
        const clientX = evt.clientX || (evt.touches && evt.touches[0]?.clientX)
        const clientY = evt.clientY || (evt.touches && evt.touches[0]?.clientY)

        if (clientX && clientY) {
          const vpt = canvas.viewportTransform
          vpt[4] += clientX - lastPosX
          vpt[5] += clientY - lastPosY
          canvas.requestRenderAll()
          lastPosX = clientX
          lastPosY = clientY
        }
      }
    }

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.setCursor('default')
      }
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)

    // Mettre à jour le curseur selon le zoom
    if (canvas.getZoom() > 1 && activeTool === 'select') {
      canvas.defaultCursor = 'grab'
    } else {
      canvas.defaultCursor = 'default'
    }

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [canvas, zoomLevel, activeTool])

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-800 flex flex-col items-center justify-center p-1 md:p-2 overflow-hidden relative"
    >
      <canvas ref={canvasRef} />

      {/* Contrôles de zoom (mobile) */}
      <div className="absolute bottom-20 right-2 md:hidden flex flex-col gap-1 bg-gray-900/90 rounded-xl p-1 border border-cyan-500/30">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-cyan-400"
        >
          <ZoomIn size={18} />
        </button>
        <div className="text-xs text-center text-cyan-400 py-1">
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-cyan-400"
        >
          <ZoomOut size={18} />
        </button>
        {zoomLevel !== 1 && (
          <>
            <button
              onClick={handleCenterView}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-cyan-400 mt-1"
              title="Centrer"
            >
              <Move size={16} />
            </button>
            <button
              onClick={handleZoomReset}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400"
              title="Reset 100%"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>

      {/* Boutons de recadrage */}
      {isCropping && (
        <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-900/95 p-2 rounded-xl shadow-lg z-10 border border-cyan-500/30">
          <button
            onClick={applyCrop}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-xs md:text-sm font-medium transition-all"
          >
            <Check size={14} />
            <span className="hidden md:inline">Appliquer</span>
            <span className="md:hidden">OK</span>
          </button>
          <button
            onClick={cancelCrop}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg text-xs md:text-sm font-medium transition-all"
          >
            <X size={14} />
            <span className="hidden md:inline">Annuler</span>
            <span className="md:hidden">Non</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageCanvas
