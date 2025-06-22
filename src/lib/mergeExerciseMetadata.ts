import { Exercise } from '@/types'
import { exerciseVideoData } from '@/data/exerciseVideoData'

export function mergeExerciseMetadata(
  exercises: Exercise[],
  videoData: typeof exerciseVideoData = exerciseVideoData
): Exercise[] {
  return exercises.map(exercise => {
    const metadata = videoData[exercise.name]
    
    if (metadata) {
      return {
        ...exercise,
        video: metadata.video,
        description: metadata.description,
        musclesWorked: metadata.musclesWorked
      }
    }
    
    return exercise
  })
} 