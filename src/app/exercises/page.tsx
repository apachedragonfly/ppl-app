'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise } from '@/types'
import ExerciseSearch from '@/components/ExerciseSearch'
import ExerciseInfoCard from '@/components/ExerciseInfoCard'
import BulkExerciseImport from '@/components/BulkExerciseImport'
import ExerciseStats from '@/components/ExerciseStats'
import ExerciseHistory from '@/components/ExerciseHistory'
import ExerciseNotes from '@/components/ExerciseNotes'
import ExerciseComparison from '@/components/ExerciseComparison'
import { mergeExerciseMetadata } from '@/lib/mergeExerciseMetadata'

interface ExerciseFormData {
  name: string
  muscle_group: string
  description?: string
  video_url?: string
  video_title?: string
  video_author?: string
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<Exercise | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [selectedExerciseForNotes, setSelectedExerciseForNotes] = useState<Exercise | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [selectedExercisesForComparison, setSelectedExercisesForComparison] = useState<Exercise[]>([])
  const [comparisonMode, setComparisonMode] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  
  // Filtering and sorting state
  const [sortBy, setSortBy] = useState<'name' | 'muscle_group' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('')
  const [filterHasVideo, setFilterHasVideo] = useState<'all' | 'with_video' | 'without_video'>('all')
  const [filterSource, setFilterSource] = useState<'all' | 'user' | 'global'>('all')
  const [filterFavorites, setFilterFavorites] = useState<'all' | 'favorites_only'>('all')
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    muscle_group: '',
    description: '',
    video_url: '',
    video_title: '',
    video_author: ''
  })

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    try {
      setLoading(true)
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase is not configured. Please set up your environment variables.')
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      // Store user ID for other components
      if (user?.id) {
        setCurrentUserId(user.id)
      }
      
      // Get exercises
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(user?.id ? `user_id.eq.${user.id},user_id.is.null` : `user_id.is.null`)
        .order('name')

      if (error) throw error

      // Get user's favorites if logged in
      let userFavorites: Set<string> = new Set()
      if (user?.id) {
        const { data: favoritesData } = await supabase
          .from('exercise_favorites')
          .select('exercise_id')
          .eq('user_id', user.id)
        
        if (favoritesData) {
          userFavorites = new Set(favoritesData.map(fav => fav.exercise_id))
        }
      }

      // Transform database format to interface format
      const transformedExercises = data?.map(exercise => ({
        ...exercise,
        // Map database video JSONB to video object (already in correct format)
        video: exercise.video || undefined,
        // Map muscles_worked JSONB to musclesWorked object
        musclesWorked: exercise.muscles_worked ? {
          primary: exercise.muscles_worked.primary || [],
          secondary: exercise.muscles_worked.secondary || []
        } : undefined,
        // Check if this exercise is favorited by the current user
        is_favorite: userFavorites.has(exercise.id)
      })) || []

      // Deduplicate exercises by name, preferring user-specific ones
      const exerciseMap = new Map()
      transformedExercises.forEach(exercise => {
        const existing = exerciseMap.get(exercise.name)
        if (!existing || (!existing.user_id && exercise.user_id === user?.id)) {
          exerciseMap.set(exercise.name, exercise)
        }
      })

      const deduplicatedExercises = Array.from(exerciseMap.values())
      // No need for mergeExerciseMetadata anymore since data comes from DB
      
      setExercises(deduplicatedExercises)
      setFilteredExercises(deduplicatedExercises)
    } catch (error: any) {
      console.error('Error loading exercises:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      setError(`Failed to load exercises: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchExercises: Exercise[]) => {
    setFilteredExercises(searchExercises)
  }

  // Apply filters and sorting to exercises
  const getFilteredAndSortedExercises = () => {
    let filtered = [...filteredExercises]

    // Apply muscle group filter
    if (filterMuscleGroup) {
      filtered = filtered.filter(exercise => 
        exercise.muscle_group?.toLowerCase() === filterMuscleGroup.toLowerCase()
      )
    }

    // Apply video filter
    if (filterHasVideo === 'with_video') {
      filtered = filtered.filter(exercise => exercise.video?.url)
    } else if (filterHasVideo === 'without_video') {
      filtered = filtered.filter(exercise => !exercise.video?.url)
    }

    // Apply source filter
    if (filterSource === 'user') {
      filtered = filtered.filter(exercise => exercise.user_id === currentUserId)
    } else if (filterSource === 'global') {
      filtered = filtered.filter(exercise => !exercise.user_id)
    }

    // Apply favorites filter
    if (filterFavorites === 'favorites_only') {
      filtered = filtered.filter(exercise => exercise.is_favorite)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'muscle_group':
          aValue = (a.muscle_group || '').toLowerCase()
          bValue = (b.muscle_group || '').toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }

  // Get unique muscle groups for filter dropdown
  const getMuscleGroups = () => {
    const groups = new Set<string>()
    exercises.forEach(exercise => {
      if (exercise.muscle_group) {
        groups.add(exercise.muscle_group)
      }
    })
    return Array.from(groups).sort()
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilterMuscleGroup('')
    setFilterHasVideo('all')
    setFilterSource('all')
    setFilterFavorites('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const handleCreateExercise = async (name: string, muscleGroup: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          name,
          muscle_group: muscleGroup,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      setMessage(`Created exercise: ${name}`)
      setTimeout(() => setMessage(''), 3000)
      loadExercises()
    } catch (error) {
      console.error('Error creating exercise:', error)
      setError('Failed to create exercise')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const exerciseData = {
        name: formData.name,
        muscle_group: formData.muscle_group,
        user_id: user.id,
        description: formData.description || null,
        video: formData.video_url ? {
          url: formData.video_url,
          title: formData.video_title || formData.name,
          author: formData.video_author || null
        } : null,
        // For now, we'll set basic muscles_worked structure
        muscles_worked: formData.muscle_group ? {
          primary: [formData.muscle_group],
          secondary: []
        } : null
      }

      if (editingExercise) {
        // Update existing exercise
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', editingExercise.id)

        if (error) throw error
        setMessage(`Updated exercise: ${formData.name}`)
      } else {
        // Create new exercise
        const { error } = await supabase
          .from('exercises')
          .insert([exerciseData])

        if (error) throw error
        setMessage(`Created exercise: ${formData.name}`)
      }

      resetForm()
      setTimeout(() => setMessage(''), 3000)
      loadExercises()
    } catch (error) {
      console.error('Error saving exercise:', error)
      setError('Failed to save exercise')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      muscle_group: exercise.muscle_group || '',
      description: exercise.description || '',
      video_url: exercise.video?.url || '',
      video_title: exercise.video?.title || '',
      video_author: exercise.video?.author || ''
    })
    setShowCreateForm(true)
  }

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (!confirm(`Are you sure you want to delete "${exercise.name}"?`)) return

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exercise.id)

      if (error) throw error

      setMessage(`Deleted exercise: ${exercise.name}`)
      setTimeout(() => setMessage(''), 3000)
      loadExercises()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      setError('Failed to delete exercise')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleToggleFavorite = async (exercise: Exercise) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (exercise.is_favorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('exercise_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exercise.id)

        if (error) throw error
        setMessage(`Removed ${exercise.name} from favorites`)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('exercise_favorites')
          .insert([{
            user_id: user.id,
            exercise_id: exercise.id
          }])

        if (error) throw error
        setMessage(`Added ${exercise.name} to favorites`)
      }

      setTimeout(() => setMessage(''), 3000)
      loadExercises()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setError('Failed to update favorite status')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleShowHistory = (exercise: Exercise) => {
    setSelectedExerciseForHistory(exercise)
    setShowHistory(true)
  }

  const handleShowNotes = (exercise: Exercise) => {
    setSelectedExerciseForNotes(exercise)
    setShowNotes(true)
  }

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode)
    setSelectedExercisesForComparison([])
  }

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercisesForComparison(prev => {
      const isSelected = prev.some(e => e.id === exercise.id)
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id)
      } else {
        return [...prev, exercise]
      }
    })
  }

  const handleStartComparison = () => {
    if (selectedExercisesForComparison.length >= 2) {
      setShowComparison(true)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      muscle_group: '',
      description: '',
      video_url: '',
      video_title: '',
      video_author: ''
    })
    setEditingExercise(null)
    setShowCreateForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-foreground">Loading exercises...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show setup instructions if there's a configuration error
  if (error && error.includes('Supabase is not configured')) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-400 mb-4">
                🔧 Database Setup Required
              </h2>
              <p className="text-yellow-700 dark:text-yellow-500 mb-6">
                Your Supabase database isn't configured yet. To get started:
              </p>
              
              <div className="text-left max-w-2xl mx-auto space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                  <h3 className="font-medium mb-2">1. Create a Supabase Project</h3>
                  <p className="text-sm text-muted-foreground">Visit <a href="https://supabase.com" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                  <h3 className="font-medium mb-2">2. Create Environment File</h3>
                  <p className="text-sm text-muted-foreground mb-2">Create a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code> file in your project root with:</p>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
                  </pre>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                  <h3 className="font-medium mb-2">3. Run Database Migrations</h3>
                  <p className="text-sm text-muted-foreground">Execute the SQL files in your project to set up the database schema</p>
                </div>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                🔄 Reload Page After Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Exercise Management</h1>
          
          {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Primary Actions Row */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                + Create
              </button>
              <button
                onClick={toggleComparisonMode}
                className={`flex-1 sm:flex-none font-medium py-2 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base ${
                  comparisonMode 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30'
                }`}
              >
                {comparisonMode ? 'Exit Compare' : 'Compare'}
              </button>
            </div>
            
            {/* Secondary Actions Row */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowStats(true)}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                📊 Stats
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                Import
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Mode Bar */}
        {comparisonMode && (
          <div className="mb-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-400">
                  Compare Mode: Select exercises to compare
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  Selected: {selectedExercisesForComparison.length} exercises
                  {selectedExercisesForComparison.length > 0 && (
                    <span className="ml-2">
                      ({selectedExercisesForComparison.map(e => e.name).join(', ')})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedExercisesForComparison([])}
                  className="px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                  disabled={selectedExercisesForComparison.length === 0}
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleStartComparison}
                  disabled={selectedExercisesForComparison.length < 2}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare Selected ({selectedExercisesForComparison.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6">
          <ExerciseSearch
            exercises={exercises}
            onSelectExercise={() => {}} // Not used in this context
            onCreateExercise={handleCreateExercise}
            placeholder="Search exercises by name..."
            className="mb-4"
          />

          {/* Advanced Filters and Sorting */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Filters & Sorting</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="name">Name</option>
                  <option value="muscle_group">Muscle Group</option>
                  <option value="created_at">Date Created</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="asc">A-Z / Oldest</option>
                  <option value="desc">Z-A / Newest</option>
                </select>
              </div>

              {/* Muscle Group Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Muscle Group
                </label>
                <select
                  value={filterMuscleGroup}
                  onChange={(e) => setFilterMuscleGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="">All Groups</option>
                  {getMuscleGroups().map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Video Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Video Status
                </label>
                <select
                  value={filterHasVideo}
                  onChange={(e) => setFilterHasVideo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="all">All Exercises</option>
                  <option value="with_video">With Video</option>
                  <option value="without_video">Without Video</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Source
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="user">My Exercises</option>
                  <option value="global">Global Exercises</option>
                </select>
              </div>

              {/* Favorites Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Favorites
                </label>
                <select
                  value={filterFavorites}
                  onChange={(e) => setFilterFavorites(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
                >
                  <option value="all">All Exercises</option>
                  <option value="favorites_only">⭐ Favorites Only</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {getFilteredAndSortedExercises().length} of {filteredExercises.length} exercises
              </div>
              <div className="flex items-center space-x-4">
                {filterMuscleGroup && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                    {filterMuscleGroup}
                  </span>
                )}
                {filterHasVideo !== 'all' && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                    {filterHasVideo === 'with_video' ? 'With Video' : 'No Video'}
                  </span>
                )}
                                 {filterSource !== 'all' && (
                   <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                     {filterSource === 'user' ? 'My Exercises' : 'Global'}
                   </span>
                 )}
                 {filterFavorites === 'favorites_only' && (
                   <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                     ⭐ Favorites
                   </span>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-md text-green-700 dark:text-green-400">
            {message}
          </div>
        )}

        {/* Exercise Statistics Modal */}
        {showStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background border border-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Exercise Statistics & Analytics</h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <ExerciseStats userId={currentUserId} />
              </div>
            </div>
          </div>
        )}

        {/* Exercise History Modal */}
        {showHistory && selectedExerciseForHistory && (
          <ExerciseHistory
            exercise={selectedExerciseForHistory}
            userId={currentUserId}
            onClose={() => {
              setShowHistory(false)
              setSelectedExerciseForHistory(null)
            }}
          />
        )}

        {/* Exercise Notes & PRs Modal */}
        {showNotes && selectedExerciseForNotes && (
          <ExerciseNotes
            exercise={selectedExerciseForNotes}
            userId={currentUserId}
            onClose={() => {
              setShowNotes(false)
              setSelectedExerciseForNotes(null)
            }}
            onUpdate={loadExercises}
          />
        )}

        {/* Exercise Comparison Modal */}
        {showComparison && selectedExercisesForComparison.length >= 2 && (
          <ExerciseComparison
            exercises={selectedExercisesForComparison}
            userId={currentUserId}
            onClose={() => {
              setShowComparison(false)
              setComparisonMode(false)
              setSelectedExercisesForComparison([])
            }}
          />
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <BulkExerciseImport
            onImportComplete={() => {
              setShowBulkImport(false)
              setMessage('Exercises imported successfully!')
              setTimeout(() => setMessage(''), 3000)
              loadExercises()
            }}
            onClose={() => setShowBulkImport(false)}
          />
        )}

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingExercise ? 'Edit Exercise' : 'Create New Exercise'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Muscle Group *
                  </label>
                  <select
                    value={formData.muscle_group}
                    onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    required
                  >
                    <option value="">Select muscle group</option>
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Legs">Legs</option>
                    <option value="Biceps">Biceps</option>
                    <option value="Triceps">Triceps</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    rows={3}
                    placeholder="Optional description of the exercise..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                {formData.video_url && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={formData.video_title}
                        onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                        placeholder="Video title (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Video Author
                      </label>
                      <input
                        type="text"
                        value={formData.video_author}
                        onChange={(e) => setFormData({ ...formData, video_author: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                        placeholder="Author/Channel name (optional)"
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {editingExercise ? 'Update Exercise' : 'Create Exercise'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {getFilteredAndSortedExercises().map(exercise => {
            const isSelected = selectedExercisesForComparison.some(e => e.id === exercise.id)
            return (
              <div 
                key={exercise.id} 
                className={`bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
                  comparisonMode 
                    ? (isSelected ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800 cursor-pointer' : 'border-border cursor-pointer hover:border-orange-300')
                    : 'border-border'
                }`}
                onClick={comparisonMode ? () => toggleExerciseSelection(exercise) : undefined}
              >
                {/* Exercise Header */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {comparisonMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExerciseSelection(exercise)}
                          className="rounded border-border text-orange-600 focus:ring-orange-500 w-4 h-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <h3 className="font-semibold text-foreground truncate">{exercise.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-2 shrink-0">{exercise.muscle_group}</p>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exercise.video?.url && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        📹 Video
                      </span>
                    )}
                    {exercise.notes && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                        📝 Notes
                      </span>
                    )}
                    {!exercise.user_id && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        Global
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  {exercise.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {exercise.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {!comparisonMode && (
                  <div className="space-y-2">
                    {/* Primary Actions Row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFavorite(exercise)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          exercise.is_favorite
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={exercise.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {exercise.is_favorite ? '⭐ Favorite' : '☆ Favorite'}
                      </button>
                      <button
                        onClick={() => handleShowHistory(exercise)}
                        className="flex-1 py-2 px-3 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                        title="View exercise history"
                      >
                        📊 History
                      </button>
                    </div>
                    
                    {/* Secondary Actions Row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowNotes(exercise)}
                        className="flex-1 py-2 px-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                        title="Notes & Personal Records"
                      >
                        📝 Notes
                      </button>
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        className="flex-1 py-2 px-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise)}
                        className="flex-1 py-2 px-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {getFilteredAndSortedExercises().length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">
              {filteredExercises.length === 0 ? 'No exercises found' : 'No exercises match your filters'}
            </div>
            {filteredExercises.length === 0 ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                Create Your First Exercise
              </button>
            ) : (
              <button
                onClick={clearAllFilters}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 