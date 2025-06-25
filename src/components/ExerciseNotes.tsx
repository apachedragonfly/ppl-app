'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exercise, PersonalRecord } from '@/types'
import { getTodayForDB } from '@/lib/utils'

interface ExerciseNotesProps {
  exercise: Exercise
  userId: string
  onClose: () => void
  onUpdate: () => void
}

export default function ExerciseNotes({ exercise, userId, onClose, onUpdate }: ExerciseNotesProps) {
  const [notes, setNotes] = useState(exercise.notes || '')
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showAddPR, setShowAddPR] = useState(false)
  const [newPR, setNewPR] = useState({
    record_type: '1rm' as PersonalRecord['record_type'],
    weight_kg: '',
    reps: '',
    sets: '',
    duration_seconds: '',
    notes: '',
    achieved_date: getTodayForDB()
  })

  useEffect(() => {
    loadPersonalRecords()
  }, [exercise.id, userId])

  const loadPersonalRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('exercise_personal_records')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exercise.id)
        .order('achieved_date', { ascending: false })

      if (error) throw error
      setPersonalRecords(data || [])
    } catch (error) {
      console.error('Error loading personal records:', error)
      setError('Failed to load personal records')
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('exercises')
        .update({ notes: notes.trim() || null })
        .eq('id', exercise.id)
        .eq('user_id', userId)

      if (error) throw error
      
      setMessage('Notes saved successfully!')
      setTimeout(() => setMessage(''), 3000)
      onUpdate()
    } catch (error) {
      console.error('Error saving notes:', error)
      setError('Failed to save notes')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const addPersonalRecord = async () => {
    try {
      setSaving(true)
      
      // Calculate total volume if applicable
      let totalVolume = null
      if (newPR.record_type === 'max_volume' && newPR.weight_kg && newPR.reps && newPR.sets) {
        totalVolume = parseFloat(newPR.weight_kg) * parseInt(newPR.reps) * parseInt(newPR.sets)
      }

      const prData = {
        user_id: userId,
        exercise_id: exercise.id,
        record_type: newPR.record_type,
        weight_kg: newPR.weight_kg ? parseFloat(newPR.weight_kg) : null,
        reps: newPR.reps ? parseInt(newPR.reps) : null,
        sets: newPR.sets ? parseInt(newPR.sets) : null,
        total_volume: totalVolume,
        duration_seconds: newPR.duration_seconds ? parseInt(newPR.duration_seconds) : null,
        notes: newPR.notes.trim() || null,
        achieved_date: newPR.achieved_date
      }

      const { error } = await supabase
        .from('exercise_personal_records')
        .upsert(prData, { 
          onConflict: 'user_id,exercise_id,record_type',
          ignoreDuplicates: false 
        })

      if (error) throw error

      setMessage('Personal record saved!')
      setTimeout(() => setMessage(''), 3000)
      setShowAddPR(false)
      resetPRForm()
      loadPersonalRecords()
    } catch (error) {
      console.error('Error saving personal record:', error)
      setError('Failed to save personal record')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const deletePR = async (prId: string) => {
    if (!confirm('Are you sure you want to delete this personal record?')) return

    try {
      const { error } = await supabase
        .from('exercise_personal_records')
        .delete()
        .eq('id', prId)
        .eq('user_id', userId)

      if (error) throw error

      setMessage('Personal record deleted')
      setTimeout(() => setMessage(''), 3000)
      loadPersonalRecords()
    } catch (error) {
      console.error('Error deleting personal record:', error)
      setError('Failed to delete personal record')
      setTimeout(() => setError(''), 3000)
    }
  }

  const resetPRForm = () => {
    setNewPR({
      record_type: '1rm',
      weight_kg: '',
      reps: '',
      sets: '',
      duration_seconds: '',
      notes: '',
      achieved_date: getTodayForDB()
    })
  }

  const formatPRDisplay = (pr: PersonalRecord) => {
    switch (pr.record_type) {
      case '1rm':
      case '3rm':
      case '5rm':
        return `${pr.weight_kg}kg × ${pr.reps} reps`
      case 'max_volume':
        return `${pr.sets} sets × ${pr.reps} reps × ${pr.weight_kg}kg = ${pr.total_volume?.toFixed(1)}kg total`
      case 'max_reps':
        return pr.weight_kg ? `${pr.reps} reps @ ${pr.weight_kg}kg` : `${pr.reps} reps (bodyweight)`
      case 'endurance':
        const minutes = Math.floor((pr.duration_seconds || 0) / 60)
        const seconds = (pr.duration_seconds || 0) % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      default:
        return 'Unknown record type'
    }
  }

  const getPRIcon = (recordType: PersonalRecord['record_type']) => {
    switch (recordType) {
      case '1rm': return '💪'
      case '3rm': return '🏋️'
      case '5rm': return '🔥'
      case 'max_volume': return '📊'
      case 'max_reps': return '🔢'
      case 'endurance': return '⏱️'
      default: return '🏆'
    }
  }

  const getRecordTypeLabel = (recordType: PersonalRecord['record_type']) => {
    switch (recordType) {
      case '1rm': return '1 Rep Max'
      case '3rm': return '3 Rep Max'
      case '5rm': return '5 Rep Max'
      case 'max_volume': return 'Max Volume'
      case 'max_reps': return 'Max Reps'
      case 'endurance': return 'Endurance'
      default: return recordType
    }
  }

  const isFormValid = () => {
    if (newPR.record_type === 'endurance') {
      return newPR.duration_seconds && parseInt(newPR.duration_seconds) > 0
    }
    if (newPR.record_type === 'max_volume') {
      return newPR.weight_kg && newPR.reps && newPR.sets
    }
    if (newPR.record_type === 'max_reps') {
      return newPR.reps && parseInt(newPR.reps) > 0
    }
    return newPR.weight_kg && newPR.reps
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{exercise.name} - Notes & Records</h2>
            <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Exercise Notes */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">Exercise Notes</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Add personal notes about this exercise (form cues, tips, modifications, etc.)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter your notes about this exercise..."
                className="w-full h-24 p-3 border border-border bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-ring focus:border-ring"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Personal Records */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Personal Records</h3>
                <button
                  onClick={() => setShowAddPR(true)}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                >
                  + Add PR
                </button>
              </div>

              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading records...</div>
              ) : personalRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No personal records yet</p>
                  <p className="text-sm">Add your first PR to start tracking your progress!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personalRecords.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getPRIcon(pr.record_type)}</span>
                        <div>
                          <div className="font-medium text-foreground">
                            {getRecordTypeLabel(pr.record_type)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPRDisplay(pr)}
                          </div>
                          {pr.notes && (
                            <div className="text-xs text-muted-foreground italic mt-1">
                              "{pr.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{new Date(pr.achieved_date).toLocaleDateString()}</span>
                        <button
                          onClick={() => deletePR(pr.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add PR Form */}
            {showAddPR && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Add Personal Record</h3>
                  <button
                    onClick={() => {
                      setShowAddPR(false)
                      resetPRForm()
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Record Type
                    </label>
                    <select
                      value={newPR.record_type}
                      onChange={(e) => setNewPR({ ...newPR, record_type: e.target.value as PersonalRecord['record_type'] })}
                      className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    >
                      <option value="1rm">1 Rep Max</option>
                      <option value="3rm">3 Rep Max</option>
                      <option value="5rm">5 Rep Max</option>
                      <option value="max_volume">Max Volume</option>
                      <option value="max_reps">Max Reps</option>
                      <option value="endurance">Endurance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date Achieved
                    </label>
                    <input
                      type="date"
                      value={newPR.achieved_date}
                      onChange={(e) => setNewPR({ ...newPR, achieved_date: e.target.value })}
                      className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    />
                  </div>

                  {newPR.record_type !== 'endurance' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Weight (kg) {newPR.record_type === 'max_reps' && '(optional for bodyweight)'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={newPR.weight_kg}
                          onChange={(e) => setNewPR({ ...newPR, weight_kg: e.target.value })}
                          className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          value={newPR.reps}
                          onChange={(e) => setNewPR({ ...newPR, reps: e.target.value })}
                          className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}

                  {newPR.record_type === 'max_volume' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={newPR.sets}
                        onChange={(e) => setNewPR({ ...newPR, sets: e.target.value })}
                        className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                        placeholder="0"
                      />
                    </div>
                  )}

                  {newPR.record_type === 'endurance' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={newPR.duration_seconds}
                        onChange={(e) => setNewPR({ ...newPR, duration_seconds: e.target.value })}
                        className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={newPR.notes}
                      onChange={(e) => setNewPR({ ...newPR, notes: e.target.value })}
                      className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      placeholder="How did it feel? Any tips?"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => {
                      setShowAddPR(false)
                      resetPRForm()
                    }}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPersonalRecord}
                    disabled={!isFormValid() || saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save PR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 