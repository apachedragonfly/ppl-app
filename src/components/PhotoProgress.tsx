'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  id: string
  url: string
  date: string
  weight?: number
  notes?: string
}

interface PhotoProgressProps {
  userId: string
}

export default function PhotoProgress({ userId }: PhotoProgressProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data for demonstration
  const mockPhotos: Photo[] = [
    {
      id: '1',
      url: '/api/placeholder/400/600',
      date: '2024-01-01',
      weight: 80,
      notes: 'Starting weight - feeling motivated!'
    },
    {
      id: '2',
      url: '/api/placeholder/400/600',
      date: '2024-02-01',
      weight: 78,
      notes: 'One month in - already seeing changes!'
    }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const newPhoto: Photo = {
      id: Date.now().toString(),
      url,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }

    setPhotos([...photos, newPhoto])
    setShowUpload(false)
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const openPhotoViewer = (photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const allPhotos = photos.length > 0 ? photos : mockPhotos
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + allPhotos.length) % allPhotos.length
      : (currentIndex + 1) % allPhotos.length
    
    setCurrentIndex(newIndex)
    setSelectedPhoto(allPhotos[newIndex])
  }

  const displayPhotos = photos.length > 0 ? photos : mockPhotos

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Photo Progress</h2>
          <p className="text-muted-foreground">Track your transformation visually</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          <Camera className="w-5 h-5" />
          <span>Add Photo</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 m-4 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Progress Photo</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleCameraCapture}
                className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg"
              >
                <Camera className="w-5 h-5" />
                <span>Take Photo</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground py-3 px-4 rounded-lg"
              >
                <Upload className="w-5 h-5" />
                <span>Upload from Gallery</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="aspect-[3/4] bg-card border border-border rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            onClick={() => openPhotoViewer(photo, index)}
          >
            <div className="relative h-full bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-sm">Progress Photo</div>
              </div>
              
              {/* Date Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex items-center space-x-1 text-white text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(photo.date).toLocaleDateString()}</span>
                </div>
                {photo.weight && (
                  <div className="text-white text-xs mt-1">
                    {photo.weight}kg
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Buttons */}
            {displayPhotos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 z-10 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 z-10 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Photo Placeholder */}
            <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Progress Photo</h3>
              <p className="text-gray-300">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
              {selectedPhoto.weight && (
                <p className="text-lg font-bold mt-2">{selectedPhoto.weight}kg</p>
              )}
              {selectedPhoto.notes && (
                <p className="text-sm text-gray-300 mt-2">{selectedPhoto.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {displayPhotos.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-3">Progress Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {displayPhotos.length}
              </div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round((new Date(displayPhotos[displayPhotos.length - 1].date).getTime() - 
                           new Date(displayPhotos[0].date).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
          </div>
          
          {displayPhotos[0].weight && displayPhotos[displayPhotos.length - 1].weight && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Weight Change</span>
                <span className={`font-semibold ${
                  (displayPhotos[displayPhotos.length - 1].weight! - displayPhotos[0].weight!) < 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {(displayPhotos[displayPhotos.length - 1].weight! - displayPhotos[0].weight!) > 0 ? '+' : ''}
                  {(displayPhotos[displayPhotos.length - 1].weight! - displayPhotos[0].weight!).toFixed(1)}kg
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 