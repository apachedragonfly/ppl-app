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
    <div className="bg-card rounded-lg shadow-lg border border-border p-4 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{exerciseName}</h3>
      
      {videoId && (
        <div className="w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video?.title || exerciseName}
            frameBorder="0"
            allowFullScreen
            className="w-full h-full rounded-md"
          />
        </div>
      )}
      
      {description && description.trim() && (
        <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
      
      {musclesWorked && (musclesWorked.primary?.length > 0 || (musclesWorked.secondary && musclesWorked.secondary.length > 0)) && (
        <div className="space-y-2">
          {musclesWorked.primary && musclesWorked.primary.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Primary muscles:</span>{' '}
              <span className="text-muted-foreground">{musclesWorked.primary.join(', ')}</span>
            </div>
          )}
          {musclesWorked.secondary && musclesWorked.secondary.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Secondary muscles:</span>{' '}
              <span className="text-muted-foreground">{musclesWorked.secondary.join(', ')}</span>
            </div>
          )}
        </div>
      )}
      
      {video?.title && video.title.trim() && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Video:</span> {video.title}
          {video.author && video.author.trim() && <span> by {video.author}</span>}
        </div>
      )}
    </div>
  )
} 