import React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

function ImageQueue({ images, currentIndex, onSelect, onRemove }) {
  const scrollContainerRef = React.useRef(null)

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="h-24 bg-gray-750 border-t border-cyan-500/20 flex items-center px-2 gap-2">
      <button
        onClick={() => scroll('left')}
        className="p-1.5 hover:bg-cyan-500/10 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
      >
        <ChevronLeft size={20} />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex-1 flex gap-2 overflow-x-auto scrollbar-thin py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
              index === currentIndex
                ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-glow'
                : 'border-gray-600/50 hover:border-cyan-500/50'
            }`}
            onClick={() => onSelect(index)}
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ opacity: index === currentIndex ? 1 : undefined }}
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-xs px-1 py-0.5 text-cyan-400 font-mono">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="p-1.5 hover:bg-cyan-500/10 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default ImageQueue
