'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Exercise, Routine, RoutineExercise, WorkoutType } from '@/types'

interface RoutineExerciseForm extends Omit<RoutineExercise, 'id' | 'routine_id'> {
  tempId: string
}

interface RoutineEditorProps {
  userId: string
  routine?: Routine
  onSave: (routine: Routine) => void
  onCancel: () => void
}

export default function RoutineEditor({ userId, routine, onSave, onCancel }: RoutineEditorProps) {
  const [name, setName] = useState(routine?.name || '')
  const [type, setType] = useState<WorkoutType>(routine?.type || 'Push')
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAvailableExercises()
    if (routine) {
      fetchRoutineExercises()
    }
  }, [routine]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAvailableExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      setAvailableExercises(data || [])
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const fetchRoutineExercises = async () => {
    if (!routine) return

    try {
      const { data, error } = await supabase
        .from('routine_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('routine_id', routine.id)
        .order('order_index')

      if (error) throw error

      const routineExercises = (data || []).map((re: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        tempId: re.id,
        exercise_id: re.exercise_id,
        order_index: re.order_index,
        sets: re.sets,
        reps: re.reps,
        weight_kg: re.weight_kg,
        exercise: re.exercise
      }))

      setExercises(routineExercises)
    } catch (error) {
      console.error('Error fetching routine exercises:', error)
    }
  }

  // Filter exercises by workout type and remove duplicates
  const getFilteredExercises = () => {
    const typeMapping: Record<WorkoutType, string[]> = {
      'Push': ['Chest', 'Shoulders', 'Triceps'],
      'Pull': ['Back', 'Biceps'],
      'Legs': ['Legs']
    }
    
    const targetMuscles = typeMapping[type] || []
    const filtered = availableExercises.filter(ex => 
      targetMuscles.includes(ex.muscle_group || '')
    )
    
    // Remove duplicates by name
    const unique = filtered.reduce((acc, current) => {
      const existing = acc.find(item => item.name === current.name)
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [] as typeof availableExercises)
    
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }

  const addExercise = () => {
    const filteredExercises = getFilteredExercises()
    const newExercise: RoutineExerciseForm = {
      tempId: Date.now().toString(),
      exercise_id: filteredExercises[0]?.id || '',
      order_index: exercises.length,
      sets: 3,
      reps: 10,
      weight_kg: 0
    }
    setExercises([...exercises, newExercise])
  }

  const removeExercise = (tempId: string) => {
    setExercises(exercises.filter(ex => ex.tempId !== tempId))
  }

  const updateExercise = (tempId: string, field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setExercises(exercises.map(ex => 
      ex.tempId === tempId ? { ...ex, [field]: value } : ex
    ))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(exercises)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order_index for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }))

    setExercises(updatedItems)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || exercises.length === 0) return

    setSaving(true)
    try {
      let routineId = routine?.id

      if (routine) {
        // Update existing routine
        const { error: routineError } = await supabase
          .from('routines')
          .update({ name, type })
          .eq('id', routine.id)

        if (routineError) throw routineError

        // Delete existing routine exercises
        const { error: deleteError } = await supabase
          .from('routine_exercises')
          .delete()
          .eq('routine_id', routine.id)

        if (deleteError) throw deleteError
      } else {
        // Create new routine
        const { data: newRoutine, error: routineError } = await supabase
          .from('routines')
          .insert({ user_id: userId, name, type })
          .select()
          .single()

        if (routineError) throw routineError
        routineId = newRoutine.id
      }

      // Insert routine exercises
      const routineExercises = exercises.map((ex, index) => ({
        routine_id: routineId,
        exercise_id: ex.exercise_id,
        order_index: index,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg || null
      }))

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercises)

      if (exercisesError) throw exercisesError

      // Fetch the updated routine
      const { data: savedRoutine, error: fetchError } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single()

      if (fetchError) throw fetchError

      onSave(savedRoutine)
    } catch (error) {
      console.error('Error saving routine:', error)
      alert('Failed to save routine')
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {routine ? 'Edit Routine' : 'Create New Routine'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Push Routine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Push">Push</option>
              <option value="Pull">Pull</option>
              <option value="Legs">Legs</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Exercises</h3>
            <button
              type="button"
              onClick={addExercise}
              disabled={getFilteredExercises().length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exercises added yet. Click &quot;Add Exercise&quot; to get started.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="exercises">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <Draggable key={exercise.tempId} draggableId={exercise.tempId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border border-gray-200 rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 cursor-move hover:text-gray-600"
                              >
                                ⋮⋮
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                  <select
                                    value={exercise.exercise_id}
                                    onChange={(e) => updateExercise(exercise.tempId, 'exercise_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select exercise...</option>
                                    {getFilteredExercises().map((ex) => (
                                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(exercise.tempId, 'sets', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Sets"
                                    min="1"
                                    required
                                  />
                                </div>

                                <div>
                                  <input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(exercise.tempId, 'reps', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Reps"
                                    min="1"
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeExercise(exercise.tempId)}
                                className="text-red-500 hover:text-red-700 font-bold text-lg"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || exercises.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </form>
    </div>
  )
} 