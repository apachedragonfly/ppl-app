'use client'

import { useState, useMemo } from 'react'
import { Exercise } from '@/types'

interface ExerciseSearchProps {
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
  onCreateExercise?: (name: string, muscleGroup: string) => void
  placeholder?: string
  className?: string
}

export default function ExerciseSearch({ 
  exercises, 
  onSelectExercise,
  onCreateExercise,
  placeholder = "Search exercises...",
  className = ""
}: ExerciseSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('')

  // Get unique muscle groups from exercises
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>()
    exercises.forEach(exercise => {
      if (exercise.muscle_group) {
        groups.add(exercise.muscle_group)
      }
    })
    return Array.from(groups).sort()
  }, [exercises])

  // Filter exercises based on search term and muscle group
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMuscleGroup = !selectedMuscleGroup || exercise.muscle_group === selectedMuscleGroup
      return matchesSearch && matchesMuscleGroup
    })
  }, [exercises, searchTerm, selectedMuscleGroup])

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
    setSearchTerm('')
    setSelectedMuscleGroup('')
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedMuscleGroup('')
  }

  const handleCreateExercise = () => {
    if (!onCreateExercise || !newExerciseName.trim() || !newExerciseMuscleGroup.trim()) return
    
    onCreateExercise(newExerciseName.trim(), newExerciseMuscleGroup.trim())
    setNewExerciseName('')
    setNewExerciseMuscleGroup('')
    setShowCreateForm(false)
    setIsOpen(false)
    setSearchTerm('')
  }

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm)
    if (!showCreateForm) {
      // Pre-fill with search term if it exists
      setNewExerciseName(searchTerm)
      setNewExerciseMuscleGroup(selectedMuscleGroup)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
        />
        {(searchTerm || selectedMuscleGroup) && (
          <button
            onClick={clearFilters}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Muscle Group Filter */}
      {muscleGroups.length > 0 && (
        <div className="mt-2">
          <select
            value={selectedMuscleGroup}
            onChange={(e) => {
              setSelectedMuscleGroup(e.target.value)
              setIsOpen(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All muscle groups</option>
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && (searchTerm || selectedMuscleGroup) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                        rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {!showCreateForm ? (
            <>
              {filteredExercises.length > 0 ? (
                <ul className="py-1">
                  {filteredExercises.slice(0, 10).map(exercise => (
                    <li key={exercise.id}>
                      <button
                        onClick={() => handleSelectExercise(exercise)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                                   text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700
                                   focus:outline-none"
                      >
                        <div className="font-medium">{exercise.name}</div>
                        {exercise.muscle_group && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {exercise.muscle_group}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                  {filteredExercises.length > 10 && (
                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                      Showing first 10 of {filteredExercises.length} results
                    </li>
                  )}
                </ul>
              ) : (
                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                  No exercises found
                </div>
              )}
              
              {/* Create New Exercise Button */}
              {onCreateExercise && searchTerm && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={toggleCreateForm}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20
                               text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20
                               focus:outline-none text-sm font-medium"
                  >
                    + Create "{searchTerm}" as new exercise
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Create Exercise Form */
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Create New Exercise</h4>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter exercise name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Muscle Group
                </label>
                <select
                  value={newExerciseMuscleGroup}
                  onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleCreateExercise}
                  disabled={!newExerciseName.trim() || !newExerciseMuscleGroup.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600
                             text-white font-medium py-2 px-3 rounded-md text-sm transition-colors
                             disabled:cursor-not-allowed"
                >
                  Create Exercise
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                             text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 