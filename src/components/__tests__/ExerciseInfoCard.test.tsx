import { render, screen } from '@testing-library/react'
import ExerciseInfoCard from '../ExerciseInfoCard'

// Mock the getYouTubeId function
jest.mock('@/lib/getYouTubeId', () => ({
  getYouTubeId: jest.fn((url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'mockVideoId123'
    }
    return null
  })
}))

describe('ExerciseInfoCard', () => {
  const mockExercise = {
    exerciseName: 'Barbell Back Squat',
    video: {
      title: 'Perfect Squat Technique',
      url: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
      author: 'Jeff Nippard'
    },
    description: 'A fundamental lower body movement that builds strength.',
    musclesWorked: {
      primary: ['Quadriceps', 'Glutes'],
      secondary: ['Hamstrings', 'Core']
    }
  }

  test('renders exercise title', () => {
    render(<ExerciseInfoCard exerciseName={mockExercise.exerciseName} />)
    expect(screen.getByText('Barbell Back Squat')).toBeInTheDocument()
  })

  test('embeds YouTube iframe with correct src', () => {
    render(<ExerciseInfoCard {...mockExercise} />)
    const iframe = screen.getByTitle('Perfect Squat Technique')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/mockVideoId123')
  })

  test('handles missing props gracefully', () => {
    render(<ExerciseInfoCard exerciseName="Test Exercise" />)
    
    // Should render title
    expect(screen.getByText('Test Exercise')).toBeInTheDocument()
    
    // Should not render video iframe
    expect(screen.queryByRole('iframe')).not.toBeInTheDocument()
    
    // Should not render description
    expect(screen.queryByText(/fundamental lower body/)).not.toBeInTheDocument()
    
    // Should render fallback YouTube search link
    expect(screen.getByText('Search YouTube for "Test Exercise"')).toBeInTheDocument()
  })

  test('shows primary and secondary muscle text', () => {
    render(<ExerciseInfoCard {...mockExercise} />)
    
    expect(screen.getByText('Primary muscles:')).toBeInTheDocument()
    expect(screen.getByText('Quadriceps, Glutes')).toBeInTheDocument()
    
    expect(screen.getByText('Secondary muscles:')).toBeInTheDocument()
    expect(screen.getByText('Hamstrings, Core')).toBeInTheDocument()
  })

  test('renders author if provided', () => {
    render(<ExerciseInfoCard {...mockExercise} />)
    
    expect(screen.getByText('Video:')).toBeInTheDocument()
    expect(screen.getByText(/Perfect Squat Technique/)).toBeInTheDocument()
    expect(screen.getByText(/by Jeff Nippard/)).toBeInTheDocument()
  })

  test('renders description when provided', () => {
    render(<ExerciseInfoCard {...mockExercise} />)
    expect(screen.getByText('A fundamental lower body movement that builds strength.')).toBeInTheDocument()
  })

  test('does not render empty sections', () => {
    render(<ExerciseInfoCard 
      exerciseName="Test Exercise"
      description=""
      musclesWorked={{ primary: [], secondary: [] }}
    />)
    
    expect(screen.queryByText('Primary muscles:')).not.toBeInTheDocument()
    expect(screen.queryByText('Secondary muscles:')).not.toBeInTheDocument()
  })

  test('renders fallback YouTube search link when no video', () => {
    render(<ExerciseInfoCard exerciseName="Bench Press" />)
    
    const link = screen.getByRole('link', { name: /Search YouTube for "Bench Press"/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/results?search_query=Bench%20Press%20exercise')
    expect(link).toHaveAttribute('target', '_blank')
  })
}) 