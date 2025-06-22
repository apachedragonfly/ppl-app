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
    <div className="bg-card rounded-lg shadow-lg border border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">{exerciseName}</h3>
      
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
      
      {!video?.url && (
        <div className="text-xs sm:text-sm">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600 transition-colors break-words"
          >
            Search YouTube for "{exerciseName}"
          </a>
        </div>
      )}
      
      {description && description.trim() && (
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
      
      {musclesWorked && (musclesWorked.primary?.length > 0 || (musclesWorked.secondary && musclesWorked.secondary.length > 0)) && (
        <div className="space-y-1 sm:space-y-2">
          {musclesWorked.primary && musclesWorked.primary.length > 0 && (
            <div className="text-xs sm:text-sm">
              <span className="font-medium text-foreground">Primary muscles:</span>{' '}
              <span className="text-muted-foreground break-words">{musclesWorked.primary.join(', ')}</span>
            </div>
          )}
          {musclesWorked.secondary && musclesWorked.secondary.length > 0 && (
            <div className="text-xs sm:text-sm">
              <span className="font-medium text-foreground">Secondary muscles:</span>{' '}
              <span className="text-muted-foreground break-words">{musclesWorked.secondary.join(', ')}</span>
            </div>
          )}
        </div>
      )}
      
      {video?.title && video.title.trim() && (
        <div className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Video:</span>{' '}
          <span className="break-words">{video.title}</span>
          {video.author && video.author.trim() && <span> by {video.author}</span>}
        </div>
      )}
    </div>
  )
} 