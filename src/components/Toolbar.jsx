import React, { useRef, useState } from 'react'
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  ArrowRight,
  Highlighter,
  Upload,
  Pencil,
  Eraser,
  Crop,
  Camera,
  Monitor,
  Video,
  EyeOff
} from 'lucide-react'

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Sélection (1)', shortcut: '1' },
  { id: 'text', icon: Type, label: 'Texte (2)', shortcut: '2' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (3)', shortcut: '3' },
  { id: 'circle', icon: Circle, label: 'Cercle (4)', shortcut: '4' },
  { id: 'arrow', icon: ArrowRight, label: 'Flèche (5)', shortcut: '5' },
  { id: 'highlight', icon: Highlighter, label: 'Surlignage (6)', shortcut: '6' },
  { id: 'blur', icon: EyeOff, label: 'Masquage (7)', shortcut: '7' },
  { id: 'draw', icon: Pencil, label: 'Dessin libre (8)', shortcut: '8' },
  { id: 'eraser', icon: Eraser, label: 'Gomme (9)', shortcut: '9' },
  { id: 'crop', icon: Crop, label: 'Recadrage (0)', shortcut: '0' },
]

function Toolbar({ activeTool, setActiveTool, onImport, onCameraCapture, onScreenCapture }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showWebcam, setShowWebcam] = useState(false)
  const videoRef = useRef(null)
  const webcamStreamRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onImport(files)
    }
    e.target.value = ''
  }

  const handleCameraCapture = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onImport(files)
    }
    e.target.value = ''
  }

  const handleScreenCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('La capture d\'écran n\'est pas supportée sur ce navigateur')
      return
    }

    setIsCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      })

      const video = document.createElement('video')
      video.srcObject = stream

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      // Attendre un frame pour s'assurer que la vidéo est prête
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      // Arrêter le stream
      stream.getTracks().forEach(track => track.stop())

      // Convertir en blob et créer un fichier
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' })
          onImport([file])
        }
      }, 'image/png')

    } catch (err) {
      console.error('Erreur de capture:', err)
      if (err.name !== 'AbortError') {
        alert('Erreur lors de la capture d\'écran')
      }
    } finally {
      setIsCapturing(false)
    }
  }

  const handleWebcamStart = async () => {
    // Vérifier si on est en HTTPS ou localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (!isSecure) {
      alert('La webcam nécessite une connexion sécurisée (HTTPS).\n\nPour l\'utiliser :\n- Accédez via https:// ou\n- Utilisez localhost')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert('La webcam n\'est pas supportée sur ce navigateur')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      })
      webcamStreamRef.current = stream
      setShowWebcam(true)
    } catch (err) {
      console.error('Erreur webcam:', err)
      if (err.name === 'NotAllowedError') {
        alert('Accès à la webcam refusé.\nVeuillez autoriser l\'accès dans les paramètres du navigateur.')
      } else {
        alert('Impossible d\'accéder à la webcam')
      }
    }
  }

  const handleWebcamCapture = () => {
    if (!videoRef.current || !webcamStreamRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `webcam_${Date.now()}.png`, { type: 'image/png' })
        onImport([file])
      }
    }, 'image/png')

    handleWebcamClose()
  }

  const handleWebcamClose = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop())
      webcamStreamRef.current = null
    }
    setShowWebcam(false)
  }

  return (
    <>
    <aside className="w-16 md:w-16 bg-gray-750 border-r border-cyan-500/20 flex flex-col items-center py-4 gap-2 overflow-y-auto">
      {/* Import Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-glow hover:shadow-glow-lg"
        title="Importer des images"
      >
        <Upload size={20} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all"
        title="Prendre une photo"
      >
        <Camera size={20} />
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Screen Capture Button */}
      <button
        onClick={handleScreenCapture}
        disabled={isCapturing}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
          isCapturing
            ? 'bg-gray-600 cursor-wait'
            : 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500'
        }`}
        title="Capture d'écran"
      >
        <Monitor size={20} />
      </button>

      {/* Webcam Button (Desktop) */}
      <button
        onClick={handleWebcamStart}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition-all"
        title="Webcam"
      >
        <Video size={20} />
      </button>

      <div className="w-10 h-px bg-cyan-500/30 my-2" />

      {/* Tool Buttons */}
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-glow'
                : 'bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
            title={tool.label}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </aside>

    {/* Webcam Modal */}
    {showWebcam && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-750 rounded-2xl p-4 border border-cyan-500/20 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-cyan-400">Webcam</h3>
            <button
              onClick={handleWebcamClose}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <video
            ref={(el) => {
              videoRef.current = el
              if (el && webcamStreamRef.current) {
                el.srcObject = webcamStreamRef.current
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl bg-black"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleWebcamClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleWebcamCapture}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Capturer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Toolbar
