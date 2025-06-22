'use client'

import { getYouTubeId } from '@/lib/getYouTubeId'

interface ExerciseInfoCardProps {
  exerciseName: string
  video?: { title: string; url: string; author?: string }
  description?: string
  musclesWorked?: { primary: string[]; secondary?: string[] }
}

export default function ExerciseInfoCard({
  exerciseName,
  video,
  description,
  musclesWorked
}: ExerciseInfoCardProps) {
  const videoId = video?.url ? getYouTubeId(video.url) : null

  return (
    <div>
      <h3>{exerciseName}</h3>
      
      {videoId && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={video?.title || exerciseName}
          frameBorder="0"
          allowFullScreen
        />
      )}
      
      {description && (
        <p>{description}</p>
      )}
      
      {musclesWorked && (
        <div>
          {musclesWorked.primary.length > 0 && (
            <div>
              <strong>Primary muscles:</strong> {musclesWorked.primary.join(', ')}
            </div>
          )}
          {musclesWorked.secondary && musclesWorked.secondary.length > 0 && (
            <div>
              <strong>Secondary muscles:</strong> {musclesWorked.secondary.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {video?.title && (
        <div>
          <strong>Video:</strong> {video.title}
          {video.author && <span> by {video.author}</span>}
        </div>
      )}
    </div>
  )
} 