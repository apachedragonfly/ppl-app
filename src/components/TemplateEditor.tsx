'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { WorkoutTemplate, WorkoutTemplateExercise, Exercise } from '@/types'
import ExerciseSearch from '@/components/ExerciseSearch'

interface TemplateEditorProps {
  template?: WorkoutTemplate
  onSave: (template: WorkoutTemplate, exercises: WorkoutTemplateExercise[]) => void
  onCancel: () => void
}

export default function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [templateForm, setTemplateForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
    workout_type: template?.workout_type || 'Push' as WorkoutTemplate['workout_type'],
    difficulty_level: template?.difficulty_level || 'Beginner' as WorkoutTemplate['difficulty_level'],
    estimated_duration_minutes: template?.estimated_duration_minutes || 45,
    is_public: template?.is_public || false,
    tags: template?.tags || [] as string[]
  })

  const [templateExercises, setTemplateExercises] = useState<WorkoutTemplateExercise[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadExercises()
    if (template) {
      loadTemplateExercises()
    }
  }, [template])

  const loadExercises = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order('name')

      if (error) throw error

      // Deduplicate exercises by name, preferring user-specific ones
      const exerciseMap = new Map()
      data?.forEach(exercise => {
        const existing = exerciseMap.get(exercise.name)
        if (!existing || (!existing.user_id && exercise.user_id === user?.id)) {
          exerciseMap.set(exercise.name, exercise)
        }
      })

      const deduplicatedExercises = Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setExercises(deduplicatedExercises)
    } catch (error) {
      console.error('Error loading exercises:', error)
      setError('Failed to load exercises')
    }
  }

  const loadTemplateExercises = async () => {
    if (!template) return

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
        .eq('template_id', template.id)
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

  const addExercise = () => {
    const newExercise: WorkoutTemplateExercise = {
      id: `temp-${Date.now()}`,
      template_id: template?.id || '',
      exercise_id: '',
      order_index: templateExercises.length,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      target_weight_kg: 0,
      rest_seconds: 60,
      notes: '',
      is_superset: false,
      superset_group: undefined,
      created_at: new Date().toISOString()
    }
    setTemplateExercises([...templateExercises, newExercise])
  }

  const updateExercise = (index: number, field: keyof WorkoutTemplateExercise, value: any) => {
    const updated = [...templateExercises]
    if (field === 'exercise_id') {
      const exercise = exercises.find(e => e.id === value)
      updated[index] = { 
        ...updated[index], 
        exercise_id: value,
        exercise: exercise
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setTemplateExercises(updated)
  }

  const removeExercise = (index: number) => {
    const updated = templateExercises.filter((_, i) => i !== index)
    // Update order indices
    updated.forEach((exercise, i) => {
      exercise.order_index = i
    })
    setTemplateExercises(updated)
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const updated = [...templateExercises]
    const [removed] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, removed)
    
    // Update order indices
    updated.forEach((exercise, i) => {
      exercise.order_index = i
    })
    setTemplateExercises(updated)
  }

  const handleSave = async () => {
    if (!templateForm.name.trim()) {
      setError('Template name is required')
      return
    }

    if (templateExercises.length === 0) {
      setError('At least one exercise is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const templateData = {
        ...templateForm,
        user_id: user.id,
        tags: templateForm.tags.length > 0 ? templateForm.tags : null
      }

      let savedTemplate: WorkoutTemplate

      if (template) {
        // Update existing template
        const { data, error } = await supabase
          .from('workout_templates')
          .update(templateData)
          .eq('id', template.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        savedTemplate = data
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('workout_templates')
          .insert([templateData])
          .select()
          .single()

        if (error) throw error
        savedTemplate = data
      }

      // Save exercises
      if (template) {
        // Delete existing exercises
        await supabase
          .from('workout_template_exercises')
          .delete()
          .eq('template_id', template.id)
      }

      // Insert new exercises
      const exercisesToSave = templateExercises.map(exercise => ({
        template_id: savedTemplate.id,
        exercise_id: exercise.exercise_id,
        order_index: exercise.order_index,
        target_sets: exercise.target_sets,
        target_reps_min: exercise.target_reps_min,
        target_reps_max: exercise.target_reps_max,
        target_weight_kg: exercise.target_weight_kg,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
        is_superset: exercise.is_superset,
        superset_group: exercise.superset_group
      }))

      const { error: exercisesError } = await supabase
        .from('workout_template_exercises')
        .insert(exercisesToSave)

      if (exercisesError) throw exercisesError

      onSave(savedTemplate, templateExercises)
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setTemplateForm({ ...templateForm, tags })
  }

  return (
    <div className="space-y-6">
      {/* Template Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Template Details</h3>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
              placeholder="e.g., My Push Day Routine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Workout Type *
            </label>
            <select
              value={templateForm.workout_type}
              onChange={(e) => setTemplateForm({ ...templateForm, workout_type: e.target.value as WorkoutTemplate['workout_type'] })}
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
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
        </div>

        <div className="mt-4">
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

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={templateForm.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
            placeholder="e.g., strength, beginner, upper body"
          />
        </div>

        <div className="mt-4 flex items-center">
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
      </div>

      {/* Template Exercises */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Exercises</h3>
          <button
            onClick={addExercise}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
          >
            Add Exercise
          </button>
        </div>

        {templateExercises.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-lg mb-4">
              No exercises added yet
            </div>
            <button
              onClick={addExercise}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
            >
              Add Your First Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templateExercises.map((exercise, index) => (
              <div key={exercise.id} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Exercise {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveExercise(index, index - 1)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                      >
                        ↑
                      </button>
                    )}
                    {index < templateExercises.length - 1 && (
                      <button
                        onClick={() => moveExercise(index, index + 1)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Exercise *
                    </label>
                    <ExerciseSearch
                      exercises={exercises}
                      selectedExercise={exercise.exercise}
                      onExerciseSelect={(selectedExercise) => updateExercise(index, 'exercise_id', selectedExercise.id)}
                      onCreateExercise={async (name, muscleGroup) => {
                        // Handle creating new exercise
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

                          setExercises(prev => [...prev, data])
                          updateExercise(index, 'exercise_id', data.id)
                          return data
                        } catch (error) {
                          console.error('Error creating exercise:', error)
                          throw error
                        }
                      }}
                      placeholder="Search exercises..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Target Sets
                    </label>
                    <input
                      type="number"
                      value={exercise.target_sets}
                      onChange={(e) => updateExercise(index, 'target_sets', parseInt(e.target.value) || 3)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Rest (seconds)
                    </label>
                    <input
                      type="number"
                      value={exercise.rest_seconds}
                      onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      min="30"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Target Reps (Min)
                    </label>
                    <input
                      type="number"
                      value={exercise.target_reps_min || ''}
                      onChange={(e) => updateExercise(index, 'target_reps_min', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      min="1"
                      max="100"
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Target Reps (Max)
                    </label>
                    <input
                      type="number"
                      value={exercise.target_reps_max || ''}
                      onChange={(e) => updateExercise(index, 'target_reps_max', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      min="1"
                      max="100"
                      placeholder="12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={exercise.target_weight_kg || ''}
                      onChange={(e) => updateExercise(index, 'target_weight_kg', parseFloat(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Notes
                    </label>
                    <textarea
                      value={exercise.notes || ''}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      rows={2}
                      placeholder="Exercise notes or instructions..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-3 px-6 rounded-md transition-colors"
        >
          {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 border border-border text-foreground hover:bg-accent disabled:opacity-50 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
} 