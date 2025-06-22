'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { WorkoutTemplate, WorkoutTemplateExercise, QuickStartRoutine, QuickStartRoutineExercise, Exercise } from '@/types'

interface WorkoutTemplatesProps {
  onStartWorkout: (template: WorkoutTemplate | QuickStartRoutine, exercises: (WorkoutTemplateExercise | QuickStartRoutineExercise)[]) => void
}

export default function WorkoutTemplates({ onStartWorkout }: WorkoutTemplatesProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [quickStartRoutines, setQuickStartRoutines] = useState<QuickStartRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'templates' | 'quick-start'>('quick-start')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [templateExercises, setTemplateExercises] = useState<WorkoutTemplateExercise[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    workout_type: 'Push' as WorkoutTemplate['workout_type'],
    difficulty_level: 'Beginner' as WorkoutTemplate['difficulty_level'],
    estimated_duration_minutes: 45,
    is_public: false,
    tags: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.id) {
        setCurrentUserId(user.id)
      }

      // Load user templates and public templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select('*')
        .or(`user_id.eq.${user?.id},is_public.eq.true`)
        .order('created_at', { ascending: false })

      // Load quick-start routines
      const { data: routinesData, error: routinesError } = await supabase
        .from('quick_start_routines')
        .select('*')
        .order('is_featured', { ascending: false })

      // Handle case where tables don't exist yet
      if (templatesError && templatesError.code === '42P01') {
        console.warn('Templates tables not found - please run the add_workout_templates.sql migration')
        setTemplates([])
      } else if (templatesError) {
        throw templatesError
      } else {
        setTemplates(templatesData || [])
      }

      if (routinesError && routinesError.code === '42P01') {
        console.warn('Quick-start routines table not found - please run the add_workout_templates.sql migration')
        setQuickStartRoutines([])
      } else if (routinesError) {
        throw routinesError
      } else {
        setQuickStartRoutines(routinesData || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('Failed to load workout templates')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateExercises = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_template_exercises')
        .select(`
          *,
          exercises (
            id,
            name,
            muscle_group
          )
        `)
        .eq('template_id', templateId)
        .order('order_index')

      if (error) throw error

      const exercisesWithDetails = data?.map(exercise => ({
        ...exercise,
        exercise: exercise.exercises
      })) || []

      setTemplateExercises(exercisesWithDetails)
    } catch (error) {
      console.error('Error loading template exercises:', error)
      setError('Failed to load template exercises')
    }
  }

  const loadQuickStartExercises = async (routineId: string) => {
    try {
      const { data, error } = await supabase
        .from('quick_start_routine_exercises')
        .select('*')
        .eq('routine_id', routineId)
        .order('order_index')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading routine exercises:', error)
      return []
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const templateData = {
        ...templateForm,
        user_id: user.id,
        tags: templateForm.tags.length > 0 ? templateForm.tags : null
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('workout_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('user_id', user.id)

        if (error) throw error
        setMessage('Template updated successfully!')
      } else {
        const { error } = await supabase
          .from('workout_templates')
          .insert([templateData])

        if (error) throw error
        setMessage('Template created successfully!')
      }

      setShowCreateTemplate(false)
      setEditingTemplate(null)
      resetTemplateForm()
      loadData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Failed to save template')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeleteTemplate = async (template: WorkoutTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', template.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      setMessage('Template deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
      loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
      setError('Failed to delete template')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleStartFromTemplate = async (template: WorkoutTemplate) => {
    await loadTemplateExercises(template.id)
    
    // Update last_used_at
    await supabase
      .from('workout_templates')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', template.id)

    onStartWorkout(template, templateExercises)
  }

  const handleStartFromQuickStart = async (routine: QuickStartRoutine) => {
    const exercises = await loadQuickStartExercises(routine.id)
    onStartWorkout(routine, exercises)
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      workout_type: 'Push',
      difficulty_level: 'Beginner',
      estimated_duration_minutes: 45,
      is_public: false,
      tags: []
    })
  }

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      workout_type: template.workout_type,
      difficulty_level: template.difficulty_level || 'Beginner',
      estimated_duration_minutes: template.estimated_duration_minutes || 45,
      is_public: template.is_public,
      tags: template.tags || []
    })
    setShowCreateTemplate(true)
  }

  const getFilteredTemplates = () => {
    return templates.filter(template => {
      const typeMatch = filterType === 'all' || template.workout_type === filterType
      const difficultyMatch = filterDifficulty === 'all' || template.difficulty_level === filterDifficulty
      return typeMatch && difficultyMatch
    })
  }

  const getFilteredQuickStart = () => {
    return quickStartRoutines.filter(routine => {
      const typeMatch = filterType === 'all' || routine.workout_type === filterType
      const difficultyMatch = filterDifficulty === 'all' || routine.difficulty_level === filterDifficulty
      return typeMatch && difficultyMatch
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 dark:text-green-400'
      case 'Intermediate': return 'text-yellow-600 dark:text-yellow-400'
      case 'Advanced': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workout Templates</h1>
          <p className="text-muted-foreground">Start workouts from templates or create your own</p>
        </div>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Create Template
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-md text-green-700 dark:text-green-400">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('quick-start')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quick-start'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Quick Start ({quickStartRoutines.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            My Templates ({templates.filter(t => t.user_id === currentUserId).length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Workout Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
            >
              <option value="all">All Types</option>
              <option value="Push">Push</option>
              <option value="Pull">Pull</option>
              <option value="Legs">Legs</option>
              <option value="Upper">Upper Body</option>
              <option value="Lower">Lower Body</option>
              <option value="Full Body">Full Body</option>
              <option value="Cardio">Cardio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Difficulty
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring text-sm"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-foreground">Loading templates...</div>
        </div>
      ) : activeTab === 'quick-start' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredQuickStart().map((routine) => (
            <div key={routine.id} className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-foreground">{routine.name}</h3>
                    {routine.is_featured && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {routine.workout_type}
                    </span>
                    <span className={getDifficultyColor(routine.difficulty_level)}>
                      {routine.difficulty_level}
                    </span>
                    <span>{formatDuration(routine.estimated_duration_minutes)}</span>
                  </div>
                  {routine.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {routine.description}
                    </p>
                  )}
                  {routine.equipment_needed && routine.equipment_needed.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-foreground mb-1">Equipment:</p>
                      <div className="flex flex-wrap gap-1">
                        {routine.equipment_needed.map((equipment, index) => (
                          <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                            {equipment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleStartFromQuickStart(routine)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTemplates().map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    {template.is_public && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        Public
                      </span>
                    )}
                    {template.user_id !== currentUserId && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Shared
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {template.workout_type}
                    </span>
                    {template.difficulty_level && (
                      <span className={getDifficultyColor(template.difficulty_level)}>
                        {template.difficulty_level}
                      </span>
                    )}
                    {template.estimated_duration_minutes && (
                      <span>{formatDuration(template.estimated_duration_minutes)}</span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {template.last_used_at && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(template.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {template.user_id === currentUserId && (
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleStartFromTemplate(template)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty States */}
      {!loading && (
        <>
          {activeTab === 'quick-start' && getFilteredQuickStart().length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">
                No quick-start routines found
              </div>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or check back later for new routines.
              </p>
            </div>
          )}

          {activeTab === 'templates' && getFilteredTemplates().length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">
                No workout templates found
              </div>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateTemplate(false)
                  setEditingTemplate(null)
                  resetTemplateForm()
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  required
                  placeholder="e.g., My Push Day Routine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  rows={3}
                  placeholder="Describe your workout template..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Workout Type *
                  </label>
                  <select
                    value={templateForm.workout_type}
                    onChange={(e) => setTemplateForm({ ...templateForm, workout_type: e.target.value as WorkoutTemplate['workout_type'] })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    required
                  >
                    <option value="Push">Push</option>
                    <option value="Pull">Pull</option>
                    <option value="Legs">Legs</option>
                    <option value="Upper">Upper Body</option>
                    <option value="Lower">Lower Body</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={templateForm.difficulty_level}
                    onChange={(e) => setTemplateForm({ ...templateForm, difficulty_level: e.target.value as WorkoutTemplate['difficulty_level'] })}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={templateForm.estimated_duration_minutes}
                  onChange={(e) => setTemplateForm({ ...templateForm, estimated_duration_minutes: parseInt(e.target.value) || 45 })}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  min="10"
                  max="300"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={templateForm.is_public}
                  onChange={(e) => setTemplateForm({ ...templateForm, is_public: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-foreground">
                  Make this template public (other users can use it)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTemplate(false)
                    setEditingTemplate(null)
                    resetTemplateForm()
                  }}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 