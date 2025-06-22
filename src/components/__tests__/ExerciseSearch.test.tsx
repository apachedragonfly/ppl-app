import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExerciseSearch from '../ExerciseSearch'
import { Exercise } from '@/types'

// Mock exercises data
const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Bench Press',
    muscle_group: 'Chest',
    user_id: 'user1',
    created_at: '2024-01-01'
  },
  {
    id: '2',
    name: 'Pull-ups',
    muscle_group: 'Back',
    user_id: 'user1',
    created_at: '2024-01-01'
  },
  {
    id: '3',
    name: 'Squats',
    muscle_group: 'Legs',
    user_id: 'user1',
    created_at: '2024-01-01'
  },
  {
    id: '4',
    name: 'Shoulder Press',
    muscle_group: 'Shoulders',
    user_id: 'user1',
    created_at: '2024-01-01'
  },
  {
    id: '5',
    name: 'Bicep Curls',
    muscle_group: 'Biceps',
    user_id: 'user1',
    created_at: '2024-01-01'
  }
]

describe('ExerciseSearch', () => {
  const mockOnSelectExercise = jest.fn()
  const mockOnCreateExercise = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders search input with placeholder', () => {
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
        placeholder="Search for exercises..."
      />
    )
    
    expect(screen.getByPlaceholderText('Search for exercises...')).toBeInTheDocument()
  })

  test('renders muscle group filter dropdown', () => {
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const muscleGroupSelect = screen.getByRole('combobox')
    expect(muscleGroupSelect).toBeInTheDocument()
    expect(screen.getByText('All muscle groups')).toBeInTheDocument()
  })

  test('shows filtered exercises when typing in search', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'bench')
    
    await waitFor(() => {
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument()
      // Check for the muscle group in the context of the exercise result
      expect(screen.getByRole('button', { name: /Barbell Bench Press/ })).toBeInTheDocument()
    })
  })

  test('filters exercises by muscle group', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const muscleGroupSelect = screen.getByRole('combobox')
    await user.selectOptions(muscleGroupSelect, 'Back')
    
    await waitFor(() => {
      expect(screen.getByText('Pull-ups')).toBeInTheDocument()
      expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument()
    })
  })

  test('calls onSelectExercise when exercise is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'bench')
    
    await waitFor(() => {
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Barbell Bench Press'))
    
    expect(mockOnSelectExercise).toHaveBeenCalledWith(mockExercises[0])
  })

  test('shows clear filters button when filters are active', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument()
    })
  })

  test('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('✕'))
    
    expect(searchInput).toHaveValue('')
  })

  test('shows "No exercises found" when no matches', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'nonexistent exercise')
    
    await waitFor(() => {
      expect(screen.getByText('No exercises found')).toBeInTheDocument()
    })
  })

  test('shows create new exercise button when onCreateExercise is provided and no results', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
        onCreateExercise={mockOnCreateExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'new exercise')
    
    await waitFor(() => {
      expect(screen.getByText('+ Create "new exercise" as new exercise')).toBeInTheDocument()
    })
  })

  test('shows create exercise form when create button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
        onCreateExercise={mockOnCreateExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'new exercise')
    
    await waitFor(() => {
      expect(screen.getByText('+ Create "new exercise" as new exercise')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('+ Create "new exercise" as new exercise'))
    
    await waitFor(() => {
      expect(screen.getByText('Create New Exercise')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter exercise name')).toBeInTheDocument()
      expect(screen.getByText('Select muscle group')).toBeInTheDocument()
    })
  })

  test('calls onCreateExercise when create form is submitted', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
        onCreateExercise={mockOnCreateExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'new exercise')
    
    await waitFor(() => {
      expect(screen.getByText('+ Create "new exercise" as new exercise')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('+ Create "new exercise" as new exercise'))
    
    await waitFor(() => {
      expect(screen.getByText('Create New Exercise')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByPlaceholderText('Enter exercise name')
    const muscleGroupSelect = screen.getByDisplayValue('Select muscle group')
    
    await user.clear(nameInput)
    await user.type(nameInput, 'Custom Exercise')
    await user.selectOptions(muscleGroupSelect, 'Chest')
    
    await user.click(screen.getByText('Create Exercise'))
    
    expect(mockOnCreateExercise).toHaveBeenCalledWith('Custom Exercise', 'Chest')
  })

  test('disables create button when form is incomplete', async () => {
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={mockExercises}
        onSelectExercise={mockOnSelectExercise}
        onCreateExercise={mockOnCreateExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'new exercise')
    
    await waitFor(() => {
      expect(screen.getByText('+ Create "new exercise" as new exercise')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('+ Create "new exercise" as new exercise'))
    
    await waitFor(() => {
      expect(screen.getByText('Create Exercise')).toBeDisabled()
    })
  })

  test('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    
    render(
      <div>
        <ExerciseSearch
          exercises={mockExercises}
          onSelectExercise={mockOnSelectExercise}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'bench')
    
    await waitFor(() => {
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument()
    })
    
    // Click on the overlay div instead of the outside element
    const overlay = screen.getByTestId('outside').parentElement?.querySelector('.fixed.inset-0')
    if (overlay) {
      fireEvent.click(overlay)
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument()
    })
  })

  test('limits results to 10 exercises', async () => {
    const manyExercises: Exercise[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Exercise ${i + 1}`,
      muscle_group: 'Chest',
      user_id: 'user1',
      created_at: '2024-01-01'
    }))
    
    const user = userEvent.setup()
    
    render(
      <ExerciseSearch
        exercises={manyExercises}
        onSelectExercise={mockOnSelectExercise}
      />
    )
    
    const searchInput = screen.getByPlaceholderText('Search exercises...')
    await user.type(searchInput, 'Exercise')
    
    await waitFor(() => {
      expect(screen.getByText('Showing first 10 of 15 results')).toBeInTheDocument()
    })
  })
})
